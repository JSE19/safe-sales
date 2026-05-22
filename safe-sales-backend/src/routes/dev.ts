import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { env } from '../env.js';
import { markOrderPaymentLocked } from './webhooks.js';
import { NotFound } from '../lib/errors.js';

const SimulatePaymentSchema = z.object({
  orderToken: z.string().min(8).max(64),
  amountNGN: z.number().int().positive().optional(),
});

const devRoute: FastifyPluginAsync = async (app) => {
  // Guard the entire plugin in production. Returning a 404 hides the surface
  // entirely so it doesn't even look like there's something to attack.
  app.addHook('onRequest', async (_request, reply) => {
    if (env.NODE_ENV === 'production') {
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Not found' } });
    }
  });

  // POST /api/dev/simulate-payment — pretend Bitnob saw a bank transfer
  // and fire the same handler the real webhook would call.
  app.post('/api/dev/simulate-payment', async (request) => {
    const body = SimulatePaymentSchema.parse(request.body);

    // If amountNGN is omitted, look it up from the order so callers can
    // just paste a token and have the right amount auto-filled.
    let amount = body.amountNGN;
    if (!amount) {
      // Lazy import to keep this file dev-only
      const { prisma } = await import('../db/client.js');
      const order = await prisma.order.findUnique({ where: { orderToken: body.orderToken } });
      if (!order) throw new NotFound('Order not found');
      amount = order.amountNGN;
    }

    const updated = await markOrderPaymentLocked(body.orderToken, amount);
    return { ok: true, orderId: updated.id, status: updated.status, simulatedAmountNGN: amount };
  });
};

export default devRoute;
