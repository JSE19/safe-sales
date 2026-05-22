import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { BadRequest, Conflict, NotFound } from '../lib/errors.js';
import { redeemLockedToken } from '../services/cashu.js';
import { sendBrandDM } from '../services/nostr.js';
import { logger } from '../lib/logger.js';

const ShipSchema = z.object({
  trackingNumber: z.string().max(80).optional(),
  carrier: z.string().max(80).optional(),
});

const ReleaseSchema = z.object({
  // Buyer's Nostr private key (hex, 64 chars) — needed to sign the Cashu
  // token release. The buyer holds this in their browser localStorage tied
  // to the orderToken (single-use, generated at /checkout).
  //
  // SECURITY NOTE: this is a one-time key with no value beyond unlocking
  // THIS specific Cashu token. After release the key has no further use.
  // We never log it; only the Cashu mint sees it (over TLS).
  buyerPrivateKeyHex: z.string().regex(/^[0-9a-fA-F]{64}$/, 'Must be 64-char hex'),
});

const DisputeSchema = z.object({
  reason: z.string().min(3).max(200),
  summary: z.string().max(2000).optional(),
  openedBy: z.enum(['buyer', 'seller']),
});

/**
 * 7-day silent-buyer auto-release timer — counted from the moment the
 * seller marks shipped.
 */
const AUTO_RELEASE_DAYS = 7;

const escrowRoute: FastifyPluginAsync = async (app) => {
  // POST /api/orders/:token/ship — seller marks shipped
  app.post<{ Params: { token: string } }>(
    '/api/orders/:token/ship',
    async (request) => {
      const body = ShipSchema.parse(request.body ?? {});
      const order = await prisma.order.findUnique({
        where: { orderToken: request.params.token },
        include: { listing: true },
      });
      if (!order) throw new NotFound('Order not found');
      if (order.status !== 'payment_locked') {
        throw new Conflict(`Cannot ship an order in status "${order.status}"`);
      }

      const shippedAt = new Date();
      const autoReleaseAt = new Date(
        shippedAt.getTime() + AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000
      );

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'shipped',
          shippedAt,
          autoReleaseAt,
          trackingNumber: body.trackingNumber,
          carrier: body.carrier,
        },
      });

      // Notify buyer via Nostr DM (best-effort)
      try {
        const tracking = body.trackingNumber
          ? ` Tracking: ${body.trackingNumber}${body.carrier ? ' via ' + body.carrier : ''}.`
          : '';
        const msg =
          `Your SafeSale order "${order.listing.title}" has been shipped.${tracking} ` +
          `Once you receive it, return to your order page to confirm and release payment, ` +
          `or open a dispute if something's wrong.`;
        await sendBrandDM(order.buyerPubkey, msg);
      } catch (err) {
        logger.warn(
          { orderId: order.id, err: err instanceof Error ? err.message : err },
          'Nostr DM to buyer (shipped) failed (non-fatal)',
        );
      }

      return { order: updated };
    },
  );

  // POST /api/orders/:token/release — buyer confirms receipt, funds release
  app.post<{ Params: { token: string } }>(
    '/api/orders/:token/release',
    async (request) => {
      const body = ReleaseSchema.parse(request.body);
      const order = await prisma.order.findUnique({
        where: { orderToken: request.params.token },
      });
      if (!order) throw new NotFound('Order not found');
      if (!['shipped', 'delivered', 'payment_locked'].includes(order.status)) {
        throw new Conflict(`Cannot release an order in status "${order.status}"`);
      }
      if (!order.cashuToken) {
        throw new BadRequest(
          'Order has no Cashu token — payment was never locked. Contact support.',
        );
      }

      // Redeem the P2PK-locked Cashu token using the buyer's private key.
      // The mint cryptographically verifies the signature matches the lock;
      // if not, BadRequest propagates from cashu service.
      const { amountSats } = await redeemLockedToken(order.cashuToken, body.buyerPrivateKeyHex);

      // PHASE 7 (mainnet ship): melt 99% to seller's LN address, 1% to
      //   SAFESALE_FEE_LN_ADDRESS. See services/lightning.ts for the
      //   LN-address-to-invoice helper. Skipped for testnet because:
      //     a) testnut.cashu.space's melt is fake
      //     b) Coinos LN address is mainnet — can't pay testnet invoice

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'completed',
          releasedAt: new Date(),
        },
      });

      return {
        order: updated,
        redeemedSats: amountSats,
        txRef: `cashu_${order.shortId}`,
      };
    },
  );

  // POST /api/orders/:token/dispute — buyer or seller opens a dispute
  app.post<{ Params: { token: string } }>(
    '/api/orders/:token/dispute',
    async (request, reply) => {
      const body = DisputeSchema.parse(request.body);

      const order = await prisma.order.findUnique({
        where: { orderToken: request.params.token },
        include: { dispute: true },
      });
      if (!order) throw new NotFound('Order not found');
      if (order.dispute) throw new Conflict('A dispute is already open on this order');
      if (!['shipped', 'delivered', 'payment_locked'].includes(order.status)) {
        throw new BadRequest(`Cannot dispute an order in status "${order.status}"`);
      }

      const directResolutionUntil = new Date(Date.now() + 72 * 60 * 60 * 1000);

      const [updatedOrder, dispute] = await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { status: 'disputed' },
        }),
        prisma.dispute.create({
          data: {
            orderId: order.id,
            reason: body.reason,
            summary: body.summary,
            openedBy: body.openedBy,
            status: 'direct_resolution',
            directResolutionUntil,
          },
        }),
      ]);

      reply.code(201);
      return { order: updatedOrder, dispute };
    },
  );
};

export default escrowRoute;
