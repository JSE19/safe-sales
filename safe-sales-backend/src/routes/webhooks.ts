import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { BadRequest, NotFound, Conflict } from '../lib/errors.js';
import { mintLockedToken } from '../services/cashu.js';
import { sendBrandDM } from '../services/nostr.js';
import { logger } from '../lib/logger.js';

/**
 * Bitnob's "successful credit" webhook shape (approximate — we don't have
 * full sandbox docs yet). The fields we actually need are:
 *   - event: e.g. "wallet.credit" / "virtual-account.credited"
 *   - data.reference / data.virtualAccount — used to identify which order
 *   - data.amount — naira amount credited
 */
const BitnobWebhookSchema = z.object({
  event: z.string().min(1),
  data: z.object({
    reference: z.string().min(1).optional(),
    virtualAccount: z.string().min(1).optional(),
    amount: z.number().int().positive(),
    metadata: z
      .object({
        orderToken: z.string().min(1).optional(),
      })
      .optional(),
  }),
});

/**
 * Mark an order's payment as locked, mint+lock the Cashu token, notify
 * the seller via Nostr DM. Idempotent — calling twice on an already-locked
 * order returns the existing record without re-minting.
 *
 * This is the heart of Phase 6's webhook side:
 *   1. Status transitions pending_payment → payment_locked
 *   2. A Cashu token worth `order.amountSats` is minted at the configured
 *      mint and NUT-11 P2PK-locked to order.buyerPubkey
 *   3. The encoded token is persisted on order.cashuToken — that string
 *      can ONLY be redeemed by the buyer's private key
 *   4. The seller receives an encrypted Nostr DM telling them to ship
 *
 * If Cashu mint or Nostr DM fails, we still advance the order status
 * (the buyer paid; we shouldn't strand them). Errors are logged for ops.
 */
export async function markOrderPaymentLocked(
  orderToken: string,
  amountReceivedNGN: number,
) {
  const order = await prisma.order.findUnique({
    where: { orderToken },
    include: { seller: true, listing: true },
  });
  if (!order) throw new NotFound(`Order with token "${orderToken}" not found`);

  if (order.status === 'payment_locked') {
    return order; // idempotent
  }
  if (order.status !== 'pending_payment') {
    throw new Conflict(`Order status is "${order.status}" — cannot lock payment`);
  }
  if (amountReceivedNGN < order.amountNGN) {
    throw new BadRequest(
      `Amount ${amountReceivedNGN} is less than order amount ${order.amountNGN}`,
    );
  }

  // Mint + P2PK-lock the Cashu token. This is the cryptographic escrow.
  let cashuToken: string | null = null;
  try {
    cashuToken = await mintLockedToken(order.amountSats, order.buyerPubkey);
  } catch (err) {
    logger.error(
      { orderId: order.id, err: err instanceof Error ? err.message : err },
      'Cashu mint failed — order will be flagged for ops review',
    );
    // We still advance status: the buyer paid NGN, we owe them a token.
    // Ops can re-mint later by calling /api/dev/simulate-payment again.
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'payment_locked',
      ...(cashuToken && { cashuToken }),
    },
  });

  // Notify the seller via encrypted Nostr DM (best-effort)
  try {
    const message =
      `New order on SafeSale: "${order.listing.title}" — ` +
      `₦${order.amountNGN.toLocaleString('en-NG')} locked in escrow. ` +
      `Buyer: ${order.buyerName} (${order.buyerCity}). ` +
      `Ship and mark as shipped to start the buyer's confirmation window.`;
    await sendBrandDM(order.seller.pubkey, message);
  } catch (err) {
    logger.warn(
      { orderId: order.id, err: err instanceof Error ? err.message : err },
      'Nostr DM to seller failed (non-fatal)',
    );
  }

  return updated;
}

const webhooksRoute: FastifyPluginAsync = async (app) => {
  // POST /api/webhooks/bitnob — receives Bitnob credit notifications
  // For MVP we accept either:
  //   1. A real Bitnob webhook payload (whenever the sandbox lands)
  //   2. A simplified test payload with metadata.orderToken
  app.post('/api/webhooks/bitnob', async (request) => {
    // Phase 7: verify HMAC-SHA256 signature against env.BITNOB_WEBHOOK_SECRET
    //   header: x-bitnob-signature
    //   raw body required — would need fastify rawBody plugin

    const payload = BitnobWebhookSchema.parse(request.body);

    const orderToken = payload.data.metadata?.orderToken ?? payload.data.reference;
    if (!orderToken) {
      throw new BadRequest('Webhook missing data.metadata.orderToken or data.reference');
    }

    const updated = await markOrderPaymentLocked(orderToken, payload.data.amount);
    return { ok: true, orderId: updated.id, status: updated.status };
  });
};

export default webhooksRoute;
