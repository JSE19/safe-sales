/**
 * SafeSale Cashu wallet helpers.
 *
 * Thin, app-specific wrappers over `@cashu/cashu-ts`. The library is
 * stateless on its own — these helpers add the SafeSale conventions
 * (default mint, sat unit, error handling, hash-for-logging).
 *
 * All functions are **frontend-only** and run in the browser. They never
 * persist secrets; persistence is the caller's responsibility (typically
 * the `useCashuWallet` hook backed by `localStorage`).
 */

import {
  Wallet,
  getEncodedToken,
  getTokenMetadata,
  type Proof,
} from "@cashu/cashu-ts";

import {
  DEFAULT_MINT_URL,
  type SafeSaleEscrowToken,
  type TokenPreview,
} from "./types";

/**
 * Construct and load a Cashu wallet for the given mint URL.
 *
 * Always call this before any wallet operation; v4's `Wallet` is
 * mostly stateless and requires `loadMint()` once per instance.
 */
export async function createWallet(mintUrl: string = DEFAULT_MINT_URL): Promise<Wallet> {
  const wallet = new Wallet(mintUrl);
  await wallet.loadMint();
  return wallet;
}

/**
 * Inspect a token string before a wallet exists. Useful for showing
 * "you are about to lock X sats with mint Y" in the UI prior to load.
 *
 * Treats the mint URL as untrusted — callers MUST validate against an
 * allowlist before instantiating a wallet with it.
 */
export function previewToken(encodedToken: string): TokenPreview {
  const meta = getTokenMetadata(encodedToken);
  return {
    mintUrl: meta.mint,
    unit: meta.unit,
    amountSats: meta.amount.toNumber(),
    isIncomplete: Boolean(meta.incompleteProofs),
  };
}

/**
 * Encode an array of P2PK-locked proofs into a transportable token string
 * and compute its SHA-256 hash for Nostr publishing.
 */
export async function encodeEscrowToken(
  mintUrl: string,
  proofs: Proof[],
  lockedToPubkey: string,
  locktimeSeconds: number,
): Promise<SafeSaleEscrowToken> {
  const encodedToken = getEncodedToken({ mint: mintUrl, proofs });
  const tokenHash = await sha256Hex(encodedToken);
  const amountSats = proofs.reduce(
    (sum, p) => sum + p.amount.toNumber(),
    0,
  );

  return {
    mintUrl,
    unit: "sat",
    proofs,
    encodedToken,
    tokenHash,
    lockedToPubkey,
    locktimeSeconds,
    amountSats,
  };
}

/**
 * Receive a P2PK-locked token by providing the private key that satisfies
 * its lock. Returns the freshly-swapped proofs the recipient now owns.
 *
 * The seller calls this with their Nostr private key (Cashu and Nostr both
 * use secp256k1, so a Nostr nsec can sign P2PK conditions). Callers MUST
 * persist the returned proofs — once received, they are spendable bearer
 * money.
 */
export async function receiveEscrowToken(
  wallet: Wallet,
  encodedToken: string,
  privkey: string,
): Promise<Proof[]> {
  return wallet.receive(encodedToken, { privkey });
}

/**
 * Compute the lowercase hex SHA-256 hash of a string. Used to derive
 * `tokenHash` for Nostr events without leaking the bearer token itself.
 */
async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
