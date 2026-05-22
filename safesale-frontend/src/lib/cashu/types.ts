/**
 * SafeSale Cashu module — public types and constants.
 *
 * Cashu is the ecash protocol that powers SafeSale's trustless escrow.
 * In SafeSale, a buyer's payment is converted into a Cashu token (sats)
 * locked to a P2PK (Pay-to-Public-Key) condition that only the seller —
 * or, after a 7-day timeout, the mediator — can spend.
 *
 * This module is **frontend-only**. Token *minting* (creating new tokens
 * after fiat is received via Bitnob) is handled by the SafeSale backend.
 * The browser handles:
 *   - Wallet lifecycle (connect to mint, load keys)
 *   - Decoding incoming locked tokens
 *   - Signing the P2PK unlock when the buyer releases payment
 *   - Displaying balances and token state to the user
 */

import type { Proof } from "@cashu/cashu-ts";

/**
 * A locked Cashu token associated with a SafeSale order. The seller can
 * redeem it only after the buyer releases (or after the timeout elapses
 * and the mediator co-signs).
 */
export interface SafeSaleEscrowToken {
  /** Cashu mint URL — must match the mint that issued the token. */
  mintUrl: string;
  /** Unit symbol; SafeSale uses `"sat"`. */
  unit: "sat";
  /** Raw proofs that make up the locked token. */
  proofs: Proof[];
  /** Encoded `cashuB...` token string for transport. Never log this in plaintext. */
  encodedToken: string;
  /** SHA-256 of `encodedToken`, safe to log and publish to Nostr. */
  tokenHash: string;
  /** The buyer's one-time P2PK pubkey (33-byte hex) the token is locked to. */
  lockedToPubkey: string;
  /** Unix seconds — after this, the mediator key can co-sign a release. */
  locktimeSeconds: number;
  /** Total sats locked (sum of proof amounts). */
  amountSats: number;
}

/**
 * Result of decoding a token string into its display-safe metadata.
 * Used before a full wallet exists, so the UI can show what the buyer
 * is about to lock/release without holding the raw proofs.
 */
export interface TokenPreview {
  mintUrl: string;
  unit: string;
  amountSats: number;
  isIncomplete: boolean;
}

/** Supported Cashu mints. The first entry is the default. */
export const SUPPORTED_MINTS = [
  // Testnut: free test sats, ideal for local dev and demo.
  "https://nofees.testnut.cashu.space",
  // Minibits: stable public mainnet mint, used for production.
  "https://mint.minibits.cash/Bitcoin",
] as const;

export const DEFAULT_MINT_URL = SUPPORTED_MINTS[0];

/** 7 days — SafeSale's standard escrow timeout in seconds. */
export const ESCROW_TIMEOUT_SECONDS = 7 * 24 * 60 * 60;
