/**
 * Cashu integration for SafeSale.
 *
 * Provides the cryptographic escrow primitive — buyers lock funds into a
 * NUT-11 P2PK-locked Cashu token that only the buyer can unlock. The
 * seller cannot steal the funds; the platform cannot freeze them
 * arbitrarily. This is the entire trust story.
 *
 * Flow:
 *   1. Buyer pays NGN → Bitnob webhook calls `mintLockedToken()`
 *      → creates a quote, mints proofs, P2PK-locks them to buyer pubkey
 *      → token (encoded string) stored on Order.cashuToken
 *   2. Buyer confirms receipt → calls `redeemLockedToken()` with their
 *      private key → mint releases the funds → returns redeemed proofs
 *      that can be melted to the seller's LN address.
 *
 * Mint requirements:
 *   - Must support NUT-11 (P2PK) — verified at boot via `verifyMintCapabilities`.
 *   - For MVP we use `testnut.cashu.space` which auto-pays its own quotes
 *     (no actual Lightning settlement on testnet). Mainnet swap requires
 *     a Lightning payment to satisfy the mint quote.
 */

import { CashuMint, CashuWallet, getEncodedTokenV4 } from '@cashu/cashu-ts';
import type { MintKeys, MintKeyset } from '@cashu/cashu-ts';
import { env } from '../env.js';
import { logger } from '../lib/logger.js';
import { BadRequest } from '../lib/errors.js';

let _mint: CashuMint | null = null;
let _cachedKeys: MintKeys | null = null;
let _cachedKeysets: MintKeyset[] | null = null;
let _activeKeysetId: string | null = null;

function getMint(): CashuMint {
  if (!_mint) {
    _mint = new CashuMint(env.CASHU_MINT_URL);
  }
  return _mint;
}

/**
 * One-time mint capability check. Called at server boot. Fails loudly if
 * the configured mint doesn't support NUT-11 (P2PK) — without it,
 * SafeSale's entire trust model breaks.
 */
export async function verifyMintCapabilities(): Promise<void> {
  const mint = getMint();
  const info = await mint.getInfo();
  const nuts = info.nuts ?? {};
  const hasP2PK = Boolean(
    // cashu-ts normalises both '11' (key) and 'nut11' formats across versions
    (nuts as Record<string, unknown>)['11'] ??
      (nuts as Record<string, unknown>).nut11,
  );
  if (!hasP2PK) {
    throw new Error(
      `Configured Cashu mint ${env.CASHU_MINT_URL} does not support NUT-11 (P2PK). ` +
        `SafeSale cannot operate against this mint. Pick a mint that lists NUT-11 in /v1/info.`,
    );
  }
  logger.info(
    { mint: env.CASHU_MINT_URL, name: info.name, version: info.version },
    'Cashu mint verified — NUT-11 supported',
  );
}

/**
 * Build a CashuWallet for the configured mint, using a sat keyset.
 *
 * cashu-ts v2 has an issue where `wallet.loadMint()` can throw on mints
 * with the longer keyset-ID format (testnut). We work around it by
 * pre-fetching keysets + keys ourselves and passing them in.
 *
 * Keysets and keys are cached for the lifetime of the process; mints
 * rarely rotate keys mid-session.
 */
async function buildWallet(): Promise<CashuWallet> {
  const mint = getMint();

  if (!_cachedKeysets || !_cachedKeys || !_activeKeysetId) {
    const allKeysets = await mint.getKeySets();
    const satKeysets = allKeysets.keysets.filter((k) => k.unit === 'sat');
    const active = satKeysets.find((k) => k.active);
    if (!active) {
      throw new Error('Cashu mint has no active sat keyset');
    }
    const keysResp = await mint.getKeys(active.id);
    const keys = keysResp.keysets.find((k) => k.id === active.id);
    if (!keys) {
      throw new Error(`Cashu mint did not return keys for keyset ${active.id}`);
    }
    _cachedKeysets = satKeysets;
    _cachedKeys = keys;
    _activeKeysetId = active.id;
  }

  const wallet = new CashuWallet(mint, {
    unit: 'sat',
    keys: [_cachedKeys],
    keysets: _cachedKeysets,
  });
  wallet.keysetId = _activeKeysetId;
  return wallet;
}

/**
 * P2PK lock requires the pubkey in compressed secp256k1 format (33 bytes
 * with a 0x02 or 0x03 prefix). Nostr stores pubkeys as the 32-byte x-only
 * form. Prepend `02` to convert — Cashu's NUT-11 accepts the convention.
 */
function nostrPubkeyToCashuP2PK(nostrHexPubkey: string): string {
  if (!/^[0-9a-fA-F]{64}$/.test(nostrHexPubkey)) {
    throw new BadRequest('Invalid Nostr pubkey (expected 64-char hex)');
  }
  return '02' + nostrHexPubkey.toLowerCase();
}

/**
 * Mint `amountSats` sats from the configured mint and P2PK-lock them to
 * the buyer's Nostr pubkey. Returns the encoded token (`cashuB...`) ready
 * to be stored on the Order row.
 *
 * On testnut.cashu.space the mint quote is auto-paid; no Lightning
 * settlement is required. On mainnet this function would need to be
 * called AFTER a real LN invoice has been paid to the quote's bolt11.
 */
export async function mintLockedToken(
  amountSats: number,
  buyerNostrPubkey: string,
): Promise<string> {
  if (amountSats < 1) throw new BadRequest('amountSats must be >= 1');

  const wallet = await buildWallet();
  const cashuPubkey = nostrPubkeyToCashuP2PK(buyerNostrPubkey);

  // Mint a small buffer above the target so the swap-and-lock step has
  // enough proofs to absorb the mint's per-input fee (NUT-2 input_fee_ppk).
  // 5 sats or 5% (whichever is greater) covers the worst case for any
  // realistic Hack4Freedom demo amount.
  const buffer = Math.max(5, Math.ceil(amountSats * 0.05));
  const mintAmount = amountSats + buffer;

  // 1. Mint quote (gets a bolt11 invoice the mint expects to be paid)
  const quote = await wallet.createMintQuote(mintAmount);

  // 2. On testnut, the quote auto-pays a moment later. On mainnet we'd
  //    have to pay the invoice via a Lightning wallet first.
  await waitForQuotePaid(wallet, quote.quote);

  // 3. Mint unlocked proofs into our wallet
  const unlockedProofs = await wallet.mintProofs(mintAmount, quote.quote);

  // 4. P2PK-lock exactly `amountSats` to the buyer's pubkey. send()
  //    returns (a) the locked subset (`send`) and (b) any change (`keep`).
  //    The mint may eat a small fee — change is the buffer minus that fee.
  const { send: lockedProofs, keep: changeProofs } = await wallet.send(
    amountSats,
    unlockedProofs,
    { pubkey: cashuPubkey },
  );

  if (changeProofs.length > 0) {
    const changeAmount = changeProofs.reduce((s, p) => s + p.amount, 0);
    logger.debug(
      { changeAmount, amountSats, mintAmount },
      'Cashu change retained after lock (discarded for MVP)',
    );
  }

  // 5. Encode as a V4 token blob ready for DB storage
  const token = getEncodedTokenV4({
    mint: env.CASHU_MINT_URL,
    proofs: lockedProofs,
  });

  logger.info(
    {
      amountSats,
      buyerNostrPubkey: buyerNostrPubkey.substring(0, 12) + '…',
      tokenLength: token.length,
    },
    'Cashu token minted and P2PK-locked',
  );

  return token;
}

/**
 * Redeem a P2PK-locked Cashu token using the buyer's Nostr private key.
 *
 * Returns the unlocked sat amount. The proofs themselves are absorbed
 * back into the SafeSale operational wallet; from there they would be
 * melted to the seller's Lightning address (see services/fee-split.ts
 * — stubbed for MVP per the testnet/mainnet split).
 *
 * Throws BadRequest if the signature is wrong or the token is malformed.
 */
export async function redeemLockedToken(
  token: string,
  buyerNostrHexPrivateKey: string,
): Promise<{ amountSats: number }> {
  if (!/^[0-9a-fA-F]{64}$/.test(buyerNostrHexPrivateKey)) {
    throw new BadRequest('Invalid Nostr private key (expected 64-char hex)');
  }

  const wallet = await buildWallet();

  let unlockedProofs;
  try {
    unlockedProofs = await wallet.receive(token, {
      privkey: buyerNostrHexPrivateKey,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    logger.warn({ err: msg }, 'Cashu redeem failed');
    throw new BadRequest(`Cashu redeem failed: ${msg}`);
  }

  const amountSats = unlockedProofs.reduce((s, p) => s + p.amount, 0);
  logger.info({ amountSats, proofCount: unlockedProofs.length }, 'Cashu token redeemed');
  return { amountSats };
}

/**
 * Poll the mint until the quote is marked PAID, with a timeout.
 * On testnut.cashu.space this resolves in <1 second (mint auto-pays).
 * On mainnet it would block waiting for a real LN payment.
 */
async function waitForQuotePaid(
  wallet: CashuWallet,
  quoteId: string,
  timeoutMs = 10_000,
  intervalMs = 250,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const state = await wallet.checkMintQuote(quoteId);
    if (state.state === 'PAID' || state.state === 'ISSUED') return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Mint quote ${quoteId} not paid within ${timeoutMs}ms`);
}
