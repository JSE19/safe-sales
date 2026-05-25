import 'dotenv/config';
import { z } from 'zod';
import { logger } from './lib/logger.js';

/**
 * Typed, validated environment configuration.
 *
 * Validation runs once at boot. If anything required is missing or malformed,
 * the process exits immediately with a helpful message — we don't want to
 * limp along with `undefined` env vars and fail mysteriously in a handler.
 *
 * Fields that are optional during early development (e.g. SAFESALE_NSEC
 * before keys are generated) are marked .optional() here and validated again
 * by the services that actually need them.
 */
const EnvSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_ORIGINS: z
    .string()
    .default('http://localhost:8080')
    .transform((s) => s.split(',').map((o) => o.trim()).filter(Boolean)),
  // Comma-separated regex patterns matched against the request Origin.
  // Useful for Vercel/Netlify preview deploys where every PR gets a fresh
  // hostname. Default allows every *.vercel.app subdomain — safe because
  // browsers only send the Origin header for cross-origin requests, and
  // an attacker controlling a *.vercel.app deploy still can't read a
  // logged-in user's cookies (we set credentials: true but don't issue
  // session cookies anyway — auth is via orderToken in the URL).
  FRONTEND_ORIGIN_REGEXES: z
    .string()
    .default('^https://([a-z0-9-]+\\.)*vercel\\.app$')
    .transform((s) =>
      s
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => new RegExp(p)),
    ),
  FRONTEND_APP_URL: z
    .string()
    .default('http://localhost:8080')
    .transform((v) => v.replace(/\/+$/, ''))
    .pipe(z.string().url()),

  // Database
  DATABASE_URL: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .pipe(z.string().url().optional()),

  // SafeSale brand identity (optional until Phase 4 generates them)
  SAFESALE_NSEC: z.string().optional(),
  SAFESALE_NPUB: z.string().optional(),
  MEDIATOR_NSEC: z.string().optional(),
  MEDIATOR_NPUB: z.string().optional(),

  // Cashu
  CASHU_MINT_URL: z.string().url().default('https://testnut.cashu.space'),

  // Lightning
  SAFESALE_FEE_LN_ADDRESS: z.string().optional(),

  // Nostr relays
  NOSTR_RELAYS: z
    .string()
    .default('wss://relay.damus.io,wss://nos.lol,wss://relay.primal.net')
    .transform((s) => s.split(',').map((u) => u.trim()).filter(Boolean)),

  // Bitnob (mocked for MVP)
  BITNOB_API_KEY: z.string().optional(),
  BITNOB_WEBHOOK_SECRET: z.string().optional(),
  BITNOB_BASE_URL: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : 'https://sandboxapi.bitnob.co'))
    .pipe(z.string().url()),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : 'SafeSale <onboarding@resend.dev>')),
  RESEND_TEST_TO_EMAIL: z.string().email().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  logger.fatal({ issues: parsed.error.issues }, 'Invalid environment configuration');
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
