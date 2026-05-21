/**
 * SafeSale API DTOs.
 *
 * Each interface mirrors the request/response shape documented in
 * `BACKEND.md` §HTTP API. Keep this file in sync with that document —
 * a breaking change there must update this file in the same PR.
 *
 * Buyer-slice endpoints only for now. Seller and admin DTOs will be
 * added when those flows are wired.
 */

/* ----------------------------- Order shapes ----------------------------- */

/** Mirrors BACKEND.md `OrderStatus` enum. */
export type ApiOrderStatus =
  | "pending_payment"
  | "payment_locked"
  | "shipped"
  | "delivered"
  | "released"
  | "disputed"
  | "resolved"
  | "refunded"
  | "expired";

/** Bitnob virtual-account details returned to the buyer at checkout. */
export interface ApiBitnobAccount {
  accountNumber: string;
  bankName: string;
  accountName: string;
  /** ISO 8601 — the buyer must complete payment before this time. */
  expiresAt: string;
}

/**
 * Read-only view of an order as returned by `GET /api/orders/:token`.
 *
 * Per BACKEND.md the response is the Order object **minus** the cashu
 * token (which is bearer money and is never returned over HTTP). The
 * UI gets `cashuTokenHash` and `p2pkPubkey` so it can render and
 * verify, but the token itself stays server-side until release.
 */
export interface ApiOrder {
  id: string;
  token: string;
  status: ApiOrderStatus;

  listingCoord: string;
  sellerPubkey: string;
  buyerPubkey: string;

  amountNGN: number;
  amountSats: number;
  mintUrl: string;
  cashuTokenHash?: string;
  p2pkPubkey?: string;

  bitnob?: ApiBitnobAccount;

  carrier?: string;
  trackingNumber?: string;
  buyerContactHint?: string;

  /** ISO 8601 timestamps */
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  lockedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  releasedAt?: string;
  autoReleaseAt?: string;
  bitnobExpiresAt?: string;

  /** The nostr event ID of the most recent kind 33888 update. */
  orderEventId?: string;
}

/* ---------------------------- Request bodies --------------------------- */

export interface CreateOrderRequest {
  /** "30018:<seller-pubkey>:<d>" — the listing coordinate per NIP-23. */
  listingCoord: string;
  /** Plaintext; backend NIP-44-encrypts it to the seller before publishing. */
  deliveryAddress: string;
  /** Email or phone string. */
  buyerContact: string;
  contactChannel: "email" | "sms";
  /**
   * If omitted, the backend generates a one-time keypair and returns it
   * in `CreateOrderResponse.buyerKeypair`. The browser MUST persist that
   * nsec to localStorage — it's required to sign the P2PK release later.
   */
  buyerPubkey?: string;
}

export interface CreateOrderResponse {
  order: ApiOrder & {
    /** Convenience: full URL to the buyer order page. */
    orderUrl: string;
  };
  /** Present only when the backend generated the buyer's key. Returned ONCE. */
  buyerKeypair?: {
    nsec: string;
    npub: string;
  };
}

export interface ReleaseOrderRequest {
  /** Schnorr signature over the cashu spend payload (NUT-11 P2PK unlock). */
  p2pkUnlockSig: string;
}

export interface ReleaseOrderResponse {
  order: ApiOrder;
}

export interface OpenDisputeRequest {
  reason:
    | "wrong_item"
    | "damaged"
    | "not_as_described"
    | "not_received"
    | "return_request";
  description: string;
  /** Blossom / nostr.build URLs of evidence already uploaded. */
  evidence: string[];
}

export interface OpenDisputeResponse {
  order: ApiOrder;
  dispute: {
    id: string;
    status:
      | "open"
      | "direct_resolution"
      | "escalated"
      | "evidence_requested"
      | "resolved";
    openedAt: string;
  };
}
