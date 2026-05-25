import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { BadRequest, Conflict, NotFound } from '../lib/errors.js';
import { createDemoLockedToken, mintLockedToken } from '../services/cashu.js';
import { sendBuyerOrderLinkEmail } from '../services/email.js';
import { logger } from '../lib/logger.js';
import { sendBrandDM } from '../services/nostr.js';

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

export async function markOrderPaymentLocked(
  orderToken: string,
  amountReceivedNGN: number,
  options: { allowDemoCashuFallback?: boolean } = {},
) {
  const order = await prisma.order.findUnique({
    where: { orderToken },
    include: { seller: true, listing: true },
  });
  if (!order) throw new NotFound(`Order with token "${orderToken}" not found`);

  if (order.status === 'payment_locked') {
    return order;
  }
  if (order.status !== 'pending_payment') {
    throw new Conflict(`Order status is "${order.status}" - cannot lock payment`);
  }
  if (amountReceivedNGN < order.amountNGN) {
    throw new BadRequest(
      `Amount ${amountReceivedNGN} is less than order amount ${order.amountNGN}`,
    );
  }

  let cashuToken: string;
  let usedDemoCashuFallback = false;
  try {
    cashuToken = await mintLockedToken(order.amountSats, order.buyerPubkey);
  } catch (err) {
    const errorDetails = {
      orderId: order.id,
      orderToken: order.orderToken,
      amountSats: order.amountSats,
      err: err instanceof Error ? err.message : err,
      stack: err instanceof Error ? err.stack : undefined,
    };

    if (!options.allowDemoCashuFallback) {
      logger.error(
        errorDetails,
        'Cashu mint failed - order remains in pending_payment, webhook should retry',
      );
      throw new Error(
        `Cashu mint failed: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }

    cashuToken = createDemoLockedToken(order.amountSats, order.buyerPubkey, order.orderToken);
    usedDemoCashuFallback = true;
    logger.warn(
      errorDetails,
      'Cashu mint failed - using demo token fallback for manual payment confirmation',
    );
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'payment_locked',
      cashuToken,
      notes: usedDemoCashuFallback
        ? [order.notes, 'Payment confirmed through demo fallback; Cashu mint unavailable.']
            .filter(Boolean)
            .join('\n')
        : order.notes,
    },
  });

  try {
    const message =
      `New order on SafeSale: "${order.listing.title}" - ` +
      `NGN ${order.amountNGN.toLocaleString('en-NG')} locked in escrow. ` +
      `Buyer: ${order.buyerName} (${order.buyerCity}). ` +
      `Ship and mark as shipped to start the buyer's confirmation window.`;
    await sendBrandDM(order.seller.pubkey, message);
  } catch (err) {
    logger.warn(
      { orderId: order.id, err: err instanceof Error ? err.message : err },
      'Nostr DM to seller failed (non-fatal)',
    );
  }

  await sendBuyerOrderLinkEmail({
    order: updated,
    listing: order.listing,
  });

  return updated;
}

const webhooksRoute: FastifyPluginAsync = async (app) => {
  app.post('/api/webhooks/bitnob', async (request) => {
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
