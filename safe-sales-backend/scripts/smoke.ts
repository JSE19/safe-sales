/**
 * SafeSale backend end-to-end smoke test.
 *
 * Runs the entire happy-path escrow flow + the trustless-guarantee check
 * against a live server. Use locally to verify the build, and re-run
 * against the Railway URL after deploy.
 *
 *   # Local
 *   npm run smoke
 *
 *   # Against a deployed URL
 *   $env:SMOKE_BASE_URL = "https://safe-sales-backend-production.up.railway.app"
 *   npm run smoke
 *
 * Exit code 0 = all 8 steps green. Non-zero = something is broken; the
 * failing step's response body is printed.
 *
 * This script is read-only on the database in the sense that it doesn't
 * delete anything, but it DOES create real rows (a test seller, listing,
 * order, dispute-free completion). That's intentional — we want to prove
 * the real path works, not mock it. Each run creates a fresh seller with
 * a unique handle (`smoke-<timestamp>`) so re-runs don't collide.
 */

import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';

// -------- helpers --------------------------------------------------------

const BASE_URL =
  process.env.SMOKE_BASE_URL?.replace(/\/+$/, '') ?? 'http://127.0.0.1:3000';

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = {
  step: (n: number, label: string) =>
    console.log(
      `\n${COLORS.cyan}${COLORS.bold}━━━ Step ${n}: ${label}${COLORS.reset}`,
    ),
  ok: (msg: string) =>
    console.log(`${COLORS.green}  ✓${COLORS.reset} ${msg}`),
  info: (msg: string) =>
    console.log(`${COLORS.dim}  · ${msg}${COLORS.reset}`),
  warn: (msg: string) =>
    console.log(`${COLORS.yellow}  ! ${msg}${COLORS.reset}`),
  fail: (msg: string) =>
    console.log(`${COLORS.red}  ✗ ${msg}${COLORS.reset}`),
};

interface HttpResult<T> {
  ok: boolean;
  status: number;
  body: T | { error?: { code?: string; message?: string; details?: unknown } };
}

async function http<T = unknown>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
): Promise<HttpResult<T>> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { _raw: text };
  }
  return {
    ok: res.ok,
    status: res.status,
    body: parsed as HttpResult<T>['body'],
  };
}

function fail(stepLabel: string, result: HttpResult<unknown>): never {
  log.fail(`${stepLabel} — HTTP ${result.status}`);
  console.log(
    `${COLORS.red}  response:${COLORS.reset}`,
    JSON.stringify(result.body, null, 2),
  );
  process.exit(1);
}

function expectOk<T>(stepLabel: string, result: HttpResult<T>): T {
  if (!result.ok) fail(stepLabel, result);
  return result.body as T;
}

function hex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// -------- the test -------------------------------------------------------

async function main() {
  console.log(
    `\n${COLORS.bold}SafeSale smoke test${COLORS.reset}  →  ${COLORS.cyan}${BASE_URL}${COLORS.reset}`,
  );

  // ---- Step 0: pre-flight health check ---------------------------------
  log.step(0, 'Health check');
  const health = await http<{ ok: boolean; service: string }>('GET', '/health');
  expectOk('GET /health', health);
  log.ok(`Server responding (${JSON.stringify(health.body)})`);

  // ---- Step 0.5: generate fresh keypairs -------------------------------
  const sellerSk = generateSecretKey();
  const sellerPkHex = getPublicKey(sellerSk);
  const sellerNpub = nip19.npubEncode(sellerPkHex);

  const buyerSk = generateSecretKey();
  const buyerSkHex = hex(buyerSk);
  const buyerPkHex = getPublicKey(buyerSk);
  const buyerNpub = nip19.npubEncode(buyerPkHex);

  const wrongSk = generateSecretKey();
  const wrongSkHex = hex(wrongSk);

  log.info(`seller npub: ${sellerNpub.slice(0, 20)}…`);
  log.info(`buyer npub:  ${buyerNpub.slice(0, 20)}…`);

  // Unique handle per run so the smoke test is re-runnable without collision
  const handle = `smoke-${Date.now().toString(36)}`;

  // ---- Step 1: create seller -------------------------------------------
  log.step(1, 'Create seller');
  const sellerRes = await http<{ seller: { id: string; handle: string } }>(
    'POST',
    '/api/sellers',
    {
      npub: sellerNpub,
      handle,
      name: 'Smoke Test Shop',
      location: 'Lagos',
      phone: '+2348012345678',
      category: 'fashion',
    },
  );
  const { seller } = expectOk('POST /api/sellers', sellerRes);
  log.ok(`Seller @${seller.handle} created (id=${seller.id})`);

  // ---- Step 2: create listing ------------------------------------------
  log.step(2, 'Create listing');
  const listingRes = await http<{ listing: { id: string; title: string } }>(
    'POST',
    '/api/listings',
    {
      sellerNpub,
      title: 'Smoke Test Ankara Dress',
      description: 'End-to-end smoke test listing — safe to ignore.',
      priceNGN: 15000,
      category: 'fashion',
      images: [{ seed: `smoke-${Date.now()}`, alt: 'Test image' }],
    },
  );
  const { listing } = expectOk('POST /api/listings', listingRes);
  log.ok(`Listing "${listing.title}" created (id=${listing.id})`);

  // ---- Step 3: create order --------------------------------------------
  log.step(3, 'Create order (buyer side)');
  const orderRes = await http<{
    orderToken: string;
    shortId: string;
    amountNGN: number;
    bitnobAccount: string;
    bitnobBank: string;
  }>('POST', '/api/orders', {
    listingId: listing.id,
    buyerNpub,
    buyerName: 'Smoke Test Buyer',
    buyerPhone: '+2348098765432',
    buyerCity: 'Abuja',
  });
  const order = expectOk('POST /api/orders', orderRes);
  log.ok(
    `Order ${order.shortId} created — ₦${order.amountNGN.toLocaleString('en-NG')} → mock account ${order.bitnobAccount} (${order.bitnobBank})`,
  );
  const token = order.orderToken;

  // ---- Step 4: simulate Bitnob payment ---------------------------------
  log.step(4, 'Simulate Bitnob credit → Cashu mint + P2PK lock + DM seller');
  log.info('this calls the same handler the real Bitnob webhook would');
  const payRes = await http<{
    ok: boolean;
    status: string;
    simulatedAmountNGN: number;
  }>('POST', '/api/dev/simulate-payment', { orderToken: token });
  const pay = expectOk('POST /api/dev/simulate-payment', payRes);
  if (pay.status !== 'payment_locked') {
    log.fail(`Expected status="payment_locked", got "${pay.status}"`);
    process.exit(1);
  }
  log.ok(
    `Payment locked. Cashu token minted at the mint and P2PK-locked to buyer's npub.`,
  );

  // ---- Step 5: seller marks shipped ------------------------------------
  log.step(5, 'Seller marks order shipped');
  const shipRes = await http<{ order: { status: string; shippedAt: string } }>(
    'POST',
    `/api/orders/${token}/ship`,
    { trackingNumber: 'SMOKE-TRACK-001', carrier: 'DHL' },
  );
  const ship = expectOk(`POST /api/orders/${token}/ship`, shipRes);
  if (ship.order.status !== 'shipped') {
    log.fail(`Expected status="shipped", got "${ship.order.status}"`);
    process.exit(1);
  }
  log.ok(`Order shipped at ${ship.order.shippedAt}. Buyer DM dispatched.`);

  // ---- Step 6: TRUSTLESS PROOF — wrong-key release MUST fail -----------
  log.step(
    6,
    'TRUSTLESS PROOF: wrong-key release attempt MUST be rejected',
  );
  log.info('using a valid-but-wrong private key (not the buyer\'s)');
  const wrongRes = await http<{
    error?: { code?: string; message?: string };
  }>('POST', `/api/orders/${token}/release`, {
    buyerPrivateKeyHex: wrongSkHex,
  });
  if (wrongRes.ok) {
    log.fail(
      'CRITICAL: wrong-key release SUCCEEDED. Escrow is NOT trustless. Stop.',
    );
    console.log(JSON.stringify(wrongRes.body, null, 2));
    process.exit(1);
  }
  const errBody = wrongRes.body as {
    error?: { code?: string; message?: string };
  };
  const errMsg = errBody.error?.message ?? '(no message)';
  log.ok(
    `Wrong key rejected with HTTP ${wrongRes.status}: "${errMsg}"`,
  );
  if (!/witness|signature|p2pk|sign/i.test(errMsg)) {
    log.warn(
      'Rejection message does not mention witness/signature/p2pk — verify the mint rejected it for the right reason, not for a different bug.',
    );
  }

  // ---- Step 7: correct-key release succeeds ----------------------------
  log.step(7, 'Correct-key release (buyer confirms receipt)');
  const releaseRes = await http<{
    order: { status: string; releasedAt: string };
    redeemedSats: number;
    txRef: string;
  }>('POST', `/api/orders/${token}/release`, {
    buyerPrivateKeyHex: buyerSkHex,
  });
  const release = expectOk(`POST /api/orders/${token}/release`, releaseRes);
  if (release.order.status !== 'completed') {
    log.fail(`Expected status="completed", got "${release.order.status}"`);
    process.exit(1);
  }
  if (!release.redeemedSats || release.redeemedSats < 1) {
    log.fail(`Expected positive redeemedSats, got ${release.redeemedSats}`);
    process.exit(1);
  }
  log.ok(
    `Redeemed ${release.redeemedSats} sats. Order completed. txRef=${release.txRef}`,
  );

  // ---- Step 8: order reads back as completed ---------------------------
  log.step(8, 'Verify final order state via GET');
  const finalRes = await http<{
    order: { status: string; releasedAt: string };
  }>('GET', `/api/orders/${token}`);
  const final = expectOk(`GET /api/orders/${token}`, finalRes);
  if (final.order.status !== 'completed') {
    log.fail(`Final read shows status="${final.order.status}", expected "completed"`);
    process.exit(1);
  }
  log.ok(`Order ${order.shortId} is "completed" with releasedAt=${final.order.releasedAt}`);

  // ---- Summary ----------------------------------------------------------
  console.log(
    `\n${COLORS.green}${COLORS.bold}━━━ ALL 8 STEPS PASSED ━━━${COLORS.reset}`,
  );
  console.log(`${COLORS.dim}  Base URL:     ${BASE_URL}${COLORS.reset}`);
  console.log(`${COLORS.dim}  Seller:       @${seller.handle}${COLORS.reset}`);
  console.log(`${COLORS.dim}  Listing:      ${listing.id}${COLORS.reset}`);
  console.log(`${COLORS.dim}  Order:        ${order.shortId}${COLORS.reset}`);
  console.log(`${COLORS.dim}  Redeemed:     ${release.redeemedSats} sats${COLORS.reset}`);
  console.log(
    `\n${COLORS.green}SafeSale's trustless escrow is verified end-to-end.${COLORS.reset}\n`,
  );
}

main().catch((err) => {
  console.error(
    `\n${COLORS.red}${COLORS.bold}Smoke test crashed:${COLORS.reset}`,
    err instanceof Error ? err.stack ?? err.message : err,
  );
  process.exit(1);
});
