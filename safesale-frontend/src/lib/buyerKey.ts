/**
 * SafeSale buyer-key store.
 *
 * The buyer never has a SafeSale account. Instead, when they hit
 * Checkout we generate a **one-time Nostr keypair** for them, send the
 * npub up to the backend in `POST /api/orders` (it becomes the Cashu
 * NUT-11 P2PK lock target), and store the nsec in this browser only,
 * keyed by `orderToken`.
 *
 * Why this design (verbatim from the backend code comment on
 * `POST /api/orders/:token/release`):
 *
 *   "The buyer holds this in their browser localStorage tied to the
 *    orderToken (single-use, generated at /checkout)."
 *
 *   "SECURITY NOTE: this is a one-time key with no value beyond
 *    unlocking THIS specific Cashu token. After release the key has
 *    no further use."
 *
 * The key is bound to one order: it cannot sign anything else, it has
 * no associated profile, and it expires the moment the order completes
 * or refunds. Even if extracted, an attacker can only release escrow
 * funds destined for that single order — which would, ironically, only
 * benefit the seller of that order.
 *
 * Layout in localStorage (one entry per order):
 *
 *   key:   `safesale:buyer:<orderToken>`
 *   value: `{ "nsec": "nsec1...", "npub": "npub1...", "createdAt": "ISO8601" }`
 *
 * After successful release (or refund) call `clearBuyerKey(token)` to
 * remove the entry. Until then we keep it indefinitely — buyers
 * frequently reopen their order page days later from a bookmark or
 * SMS link, and the release button must still work.
 */

import { generateSecretKey, getPublicKey, nip19 } from "nostr-tools";

/* ----------------------- hex / bytes conversion ----------------------- */
// Inlined rather than imported from `@noble/hashes/utils` so we don't
// depend on a transitive of nostr-tools that could vanish on a major
// bump. Six lines, well-tested shape.

function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, "0");
  }
  return s;
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("hex string must be even-length");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

/** A buyer's one-time keypair, persisted per-order in this browser. */
export interface BuyerKey {
  /** Bech32 nsec. Required to release the Cashu escrow token. */
  nsec: string;
  /** Bech32 npub. Sent to the backend at order creation. */
  npub: string;
  /** ISO 8601 — when this key was generated (for debugging only). */
  createdAt: string;
}

const KEY_PREFIX = "safesale:buyer:";

function storageKey(orderToken: string): string {
  return `${KEY_PREFIX}${orderToken}`;
}

/**
 * Generate a fresh keypair, persist it under the given order token, and
 * return it. Calling this **overwrites** any existing key for the same
 * token — only call it once per order (at checkout, immediately before
 * `createOrder`).
 *
 * Callers should also send `result.npub` up to the backend in the
 * `CreateOrderRequest.buyerNpub` field; the backend NUT-11-locks the
 * Cashu token to it.
 */
export function generateBuyerKey(orderToken: string): BuyerKey {
  const secretBytes = generateSecretKey();
  const pubkeyHex = getPublicKey(secretBytes);
  const nsec = nip19.nsecEncode(secretBytes);
  const npub = nip19.npubEncode(pubkeyHex);
  const entry: BuyerKey = {
    nsec,
    npub,
    createdAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(storageKey(orderToken), JSON.stringify(entry));
  } catch {
    // localStorage may throw in incognito with quota set to 0, or when
    // disabled. We still return the keypair — the caller can choose to
    // proceed (degraded: release won't work after page reload) or warn
    // the user. Hooks that depend on persistence call `getBuyerKey()`
    // later and see `null`, then surface a clear error there.
  }
  return entry;
}

/**
 * Re-persist an existing keypair under a new orderToken — used when
 * the keypair was generated before the order token was known (because
 * the backend mints the token in the same call that needs the npub),
 * then re-stored under the real token once the response lands.
 *
 * Does NOT generate a new key. Use `generateBuyerKey` for that.
 */
export function persistBuyerKey(orderToken: string, key: Pick<BuyerKey, "nsec" | "npub">): void {
  const entry: BuyerKey = {
    nsec: key.nsec,
    npub: key.npub,
    createdAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(storageKey(orderToken), JSON.stringify(entry));
  } catch {
    // best-effort, same reasoning as generateBuyerKey
  }
}

/**
 * Read the stored buyer key for an order. Returns `null` when no key
 * exists for this token in this browser — typically means the buyer is
 * opening the page from a different device than they used at checkout,
 * which is a known UX failure mode flagged elsewhere in the UI.
 */
export function getBuyerKey(orderToken: string): BuyerKey | null {
  let raw: string | null;
  try {
    raw = localStorage.getItem(storageKey(orderToken));
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as BuyerKey).nsec === "string" &&
      typeof (parsed as BuyerKey).npub === "string"
    ) {
      return parsed as BuyerKey;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Hex form of the buyer's private key for this order — the shape the
 * backend's `POST /api/orders/:token/release` endpoint expects in its
 * `buyerPrivateKeyHex` field. Returns `null` if no key is stored.
 */
export function getBuyerPrivateKeyHex(orderToken: string): string | null {
  const key = getBuyerKey(orderToken);
  if (!key) return null;
  try {
    const decoded = nip19.decode(key.nsec);
    if (decoded.type !== "nsec") return null;
    return bytesToHex(decoded.data);
  } catch {
    return null;
  }
}

/**
 * Remove the stored key for an order. Call after a successful release
 * or refund — at that point the key has no further use and we
 * shouldn't keep it around indefinitely.
 */
export function clearBuyerKey(orderToken: string): void {
  try {
    localStorage.removeItem(storageKey(orderToken));
  } catch {
    // Same as generate: best-effort.
  }
}

/**
 * Convert a hex private key back into a Uint8Array — useful when other
 * Nostr APIs (signer interfaces) want raw bytes. Exposed mostly for
 * tests and the eventual Cashu P2PK signing path; not used by the
 * release flow itself (which sends hex straight to the backend).
 */
export function hexToSecretKey(hex: string): Uint8Array {
  return hexToBytes(hex);
}
