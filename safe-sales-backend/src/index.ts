import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import { env } from './env.js';
import { logger } from './lib/logger.js';
import { HttpError } from './lib/errors.js';
import { verifyMintCapabilities } from './services/cashu.js';

import sellersRoute from './routes/sellers.js';
import listingsRoute from './routes/listings.js';
import ordersRoute from './routes/orders.js';
import escrowRoute from './routes/escrow.js';
import webhooksRoute from './routes/webhooks.js';
import devRoute from './routes/dev.js';

/**
 * SafeSale backend API.
 *
 * Bootstraps Fastify with CORS, structured logging, a /health probe, a
 * consistent error envelope, and all /api/* route plugins.
 */
async function buildServer() {
  const app = Fastify({
    loggerInstance: logger,
    disableRequestLogging: false,
    trustProxy: true, // Railway sits behind a proxy
  });

  // CORS — allow the frontend (Vite dev on :8080, plus prod origin once deployed)
  await app.register(cors, {
    origin: env.FRONTEND_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Unified error handler — turns thrown HttpError / ZodError / unknown
  // into the consistent { error: { code, message, details? } } envelope.
  app.setErrorHandler((err, request, reply) => {
    if (err instanceof HttpError) {
      reply.code(err.status).send({ error: err.toPayload() });
      return;
    }
    if (err instanceof ZodError) {
      reply.code(422).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request body failed validation',
          details: err.issues,
        },
      });
      return;
    }
    // Fastify's own validation errors (from schema or @fastify/cors)
    const fastifyErr = err as { validation?: unknown; message?: string };
    if (fastifyErr.validation) {
      reply.code(400).send({
        error: {
          code: 'BAD_REQUEST',
          message: fastifyErr.message ?? 'Bad request',
          details: fastifyErr.validation,
        },
      });
      return;
    }
    request.log.error({ err }, 'Unhandled error');
    const message = err instanceof Error ? err.message : 'Something went wrong';
    reply.code(500).send({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: env.NODE_ENV === 'production' ? 'Something went wrong' : message,
      },
    });
  });

  // Healthcheck — Railway pings this. Don't query the DB here; we want
  // /health to reflect "server is responding", not "everything is wired".
  app.get('/health', async () => ({
    ok: true,
    service: 'safe-sale-backend',
    env: env.NODE_ENV,
    uptime: Math.round(process.uptime()),
  }));

  // Root — friendly landing for anyone who hits the bare URL
  app.get('/', async () => ({
    service: 'SafeSale API',
    docs: 'https://github.com/JSE19/safe-sales',
    health: '/health',
  }));

  // Register all API route plugins
  await app.register(sellersRoute);
  await app.register(listingsRoute);
  await app.register(ordersRoute);
  await app.register(escrowRoute);
  await app.register(webhooksRoute);
  await app.register(devRoute);

  return app;
}

async function start() {
  // Verify external dependencies before opening the port. We DO check the
  // Cashu mint (without it the entire escrow primitive fails); we DON'T
  // check Nostr relays or LN endpoints (best-effort, won't block startup).
  try {
    await verifyMintCapabilities();
  } catch (err) {
    logger.fatal({ err: err instanceof Error ? err.message : err }, 'Cashu mint check failed');
    process.exit(1);
  }

  const app = await buildServer();

  try {
    const address = await app.listen({
      port: env.PORT,
      host: '0.0.0.0', // critical: Railway routes from outside the container
    });
    logger.info({ address, env: env.NODE_ENV }, 'SafeSale backend listening');
  } catch (err) {
    logger.fatal(err, 'Failed to start server');
    process.exit(1);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down');
    try {
      await app.close();
      process.exit(0);
    } catch (err) {
      logger.error(err, 'Error during shutdown');
      process.exit(1);
    }
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
