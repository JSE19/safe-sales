import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { nip19 } from 'nostr-tools';
import { prisma } from '../db/client.js';
import { BadRequest, NotFound } from '../lib/errors.js';
import { generateOrderToken, generateShortId } from '../lib/errors.js';
import { markOrderPaymentLocked } from './webhooks.js';

const CreateOrderSchema = z.object({
  listingId: z.string().min(1),
  buyerNpub: z.string().regex(/^npub1[0-9a-z]+$/, 'Must be a bech32 npub'),
  buyerName: z.string().min(2).max(80),
  buyerPhone: z.string().min(7).max(20),
  buyerEmail: z.string().email().optional(),
  buyerCity: z.string().min(2).max(80),
  buyerAddress: z.string().max(280).optional(),
  contactMethod: z.enum(['phone', 'email']).default('phone'),
  variant: z.string().max(60).optional(),
});

/**
 * NGN→sats conversion. For MVP we use a flat rate (~1 sat = ₦0.90).
 * Real rate would come from Bitnob's quote API at order time.
 */
const NGN_PER_SAT = 0.9;
const ngnToSats = (ngn: number): number => Math.ceil(ngn / NGN_PER_SAT);

const ordersRoute: FastifyPluginAsync = async (app) => {
  // POST /api/orders — buyer initiates a purchase
  app.post('/api/orders', async (request, reply) => {
    const body = CreateOrderSchema.parse(request.body);

    const listing = await prisma.listing.findUnique({
      where: { id: body.listingId },
      include: { seller: true },
    });
    if (!listing) throw new BadRequest('Listing not found');
    if (!listing.active) throw new BadRequest('Listing is not active');
    if (listing.inStock <= 0) throw new BadRequest('Listing is out of stock');

    // Decode buyer npub → hex pubkey (P2PK target for the Cashu token)
    let buyerPubkey: string;
    try {
      const decoded = nip19.decode(body.buyerNpub);
      if (decoded.type !== 'npub') throw new BadRequest('buyerNpub must be an npub');
      buyerPubkey = decoded.data;
    } catch (err) {
      if (err instanceof BadRequest) throw err;
      throw new BadRequest('Invalid buyer npub');
    }

    const amountNGN = listing.priceNGN;
    const amountSats = ngnToSats(amountNGN);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Mock Bitnob virtual account (replaced with real API call when sandbox lands)
    const bitnobAccount = '0123456789';
    const bitnobBank = 'Access Bank';

    const order = await prisma.order.create({
      data: {
        shortId: generateShortId(),
        orderToken: generateOrderToken(),
        listingId: listing.id,
        sellerId: listing.sellerId,
        buyerNpub: body.buyerNpub,
        buyerPubkey,
        buyerName: body.buyerName,
        buyerPhone: body.buyerPhone,
        buyerEmail: body.buyerEmail,
        buyerCity: body.buyerCity,
        buyerAddress: body.buyerAddress,
        contactMethod: body.contactMethod,
        variant: body.variant,
        amountNGN,
        amountSats,
        status: 'pending_payment',
        bitnobAccount,
        bitnobBank,
        expiresAt,
      },
    });

    reply.code(201);
    return {
      orderToken: order.orderToken,
      shortId: order.shortId,
      bitnobAccount: order.bitnobAccount,
      bitnobBank: order.bitnobBank,
      amountNGN: order.amountNGN,
      expiresAt: order.expiresAt,
    };
  });

  // GET /api/orders/:token — buyer order page data (no auth — token IS the auth)
  app.get<{ Params: { token: string } }>('/api/orders/:token', async (request) => {
    const order = await prisma.order.findUnique({
      where: { orderToken: request.params.token },
      include: {
        listing: true,
        seller: true,
        dispute: true,
      },
    });
    if (!order) throw new NotFound('Order not found — check your link');

    return {
      order,
      listing: order.listing,
      seller: order.seller,
      dispute: order.dispute,
    };
  });

  // POST /api/orders/:token/confirm-payment - MVP instant approval.
  // This replaces Bitnob virtual-account verification until production
  // payment rails can confirm bank transfers automatically.
  app.post<{ Params: { token: string } }>(
    '/api/orders/:token/confirm-payment',
    async (request) => {
      const order = await prisma.order.findUnique({
        where: { orderToken: request.params.token },
      });
      if (!order) throw new NotFound('Order not found - check your link');

      const updated = await markOrderPaymentLocked(order.orderToken, order.amountNGN, {
        allowDemoCashuFallback: true,
      });

      return {
        ok: true,
        orderId: updated.id,
        status: updated.status,
      };
    },
  );

  // GET /api/orders/seller/:npub — seller dashboard order list
  app.get<{ Params: { npub: string } }>('/api/orders/seller/:npub', async (request) => {
    const seller = await prisma.seller.findUnique({ where: { npub: request.params.npub } });
    if (!seller) throw new NotFound('Seller not found');

    const orders = await prisma.order.findMany({
      where: { sellerId: seller.id },
      include: { listing: true, dispute: true },
      orderBy: { createdAt: 'desc' },
    });

    return { orders };
  });
};

export default ordersRoute;
