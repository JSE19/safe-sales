/**
 * SafeSale API DTOs.
 *
 * Mirrors the shapes returned by the SafeSale backend on
 * `origin/backend` (Fastify + Prisma + Postgres). Specifically:
 *
 *   - `prisma/schema.prisma`  — the `Order`, `Listing`, `Seller`,
 *     `Dispute` models + `EscrowStatus`/`DisputeStatus` enums.
 *   - `src/routes/orders.ts`   — POST /api/orders, GET /api/orders/:token
 *   - `src/routes/escrow.ts`   — POST /api/orders/:token/ship | release | dispute
 *   - `src/routes/listings.ts` — POST /api/listings, GET /api/listings/:id
 *   - `src/routes/sellers.ts`  — POST /api/sellers, GET /api/sellers/:handle
 *
 * Keep this file in lockstep with that schema. When the backend evolves,
 * update it here in the same PR — the build will catch every consumer.
 *
 * Buyer-slice endpoints are typed in full. Seller and admin endpoints
 * are added as those flows are wired (currently just enough to make the
 * checkout → buyer-order flow work end-to-end).
 */

/* --------------------------------- enums ------------------------------- */

/** Mirrors prisma `EscrowStatus`. 7 values, no aliases. */
export type ApiOrderStatus =
  | "pending_payment"
  | "payment_locked"
  | "shipped"
  | "delivered"
  | "completed"
  | "disputed"
  | "refunded";

/** Mirrors prisma `DisputeStatus`. */
export type ApiDisputeStatus =
  | "direct_resolution"
  | "escalated"
  | "evidence_requested"
  | "mediating"
  | "resolved";

/* -------------------------------- entities ----------------------------- */

/** A listing image as stored in `Listing.images` (Json field). */
export interface ApiListingImage {
  url?: string;
  /** Deterministic seed used by `ProductImage` when no URL is present. */
  seed?: string;
  alt?: string;
}

/** Subset of `Seller` returned by `GET /api/orders/:token` (no payout details). */
export interface ApiSeller {
  id: string;
  npub: string;
  pubkey: string;
  handle: string;
  name: string;
  location: string;
  category: string;
  bio?: string | null;
  verified: boolean;
  /** Present when the seller has set a Lightning payout address. */
  lnAddress?: string | null;
  createdAt: string;
}

/** Subset of `Listing` returned by `GET /api/orders/:token`. */
export interface ApiListing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  priceNGN: number;
  images: ApiListingImage[];
  category: string;
  variants?: string[] | null;
  inStock: number;
  delivery?: string | null;
  active: boolean;
  nostrEventId?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * `Order` row from the backend. Mirrors prisma `Order` exactly,
 * except `cashuToken` is **never** returned over HTTP — it is bearer
 * money and the backend holds it server-side until release.
 */
export interface ApiOrder {
  id: string;
  shortId: string;
  /**
   * URL-safe secret. This is the buyer's only credential — possession
   * of the token IS the auth. Present in the URL at /order/:token.
   */
  orderToken: string;

  listingId: string;
  sellerId: string;

  /** Bech32 of the buyer's one-time Nostr key (P2PK lock target). */
  buyerNpub: string;
  /** Hex form of the same key. */
  buyerPubkey: string;

  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string | null;
  buyerCity: string;
  buyerAddress?: string | null;
  contactMethod?: "phone" | "email" | null;

  variant?: string | null;

  amountNGN: number;
  amountSats: number;

  status: ApiOrderStatus;

  /** Bitnob virtual account assigned at order creation (24h expiry). */
  bitnobAccount?: string | null;
  bitnobBank?: string | null;

  trackingNumber?: string | null;
  carrier?: string | null;

  shippedAt?: string | null;
  releasedAt?: string | null;
  refundedAt?: string | null;

  /** 7 days after `shippedAt` — silent-buyer auto-release deadline. */
  autoReleaseAt?: string | null;
  /** Bitnob virtual-account expiry. */
  expiresAt?: string | null;

  notes?: string | null;

  createdAt: string;
  updatedAt: string;
}

/** A `Dispute` row, nullable on the order envelope. */
export interface ApiDispute {
  id: string;
  orderId: string;
  reason: string;
  summary?: string | null;
  openedBy: "buyer" | "seller";
  priority: "low" | "medium" | "high";
  status: ApiDisputeStatus;
  directResolutionUntil?: string | null;
  evidenceDueAt?: string | null;
  isReturn: boolean;
  /** Photo evidence references (Blossom URLs etc.). Shape evolves with the dispute flow. */
  returnEvidence?: unknown;
  /** Final outcome JSON, populated only when `status === 'resolved'`. */
  resolution?: unknown;
  createdAt: string;
  resolvedAt?: string | null;
}

/* ------------------------- request / response shapes ------------------- */

/**
 * `POST /api/orders` request body. Field names match the Zod schema in
 * `backend/src/routes/orders.ts::CreateOrderSchema`.
 */
export interface CreateOrderRequest {
  /** cuid from `GET /api/listings/:id`. */
  listingId: string;
  /** Bech32 of the buyer's one-time Nostr key (generated in browser). */
  buyerNpub: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  buyerCity: string;
  buyerAddress?: string;
  contactMethod?: "phone" | "email";
  variant?: string;
}

/**
 * `POST /api/orders` response body — flat, no nested `order`. Mirrors
 * the explicit return statement in `routes/orders.ts`.
 */
export interface CreateOrderResponse {
  orderToken: string;
  shortId: string;
  bitnobAccount: string;
  bitnobBank: string;
  amountNGN: number;
  expiresAt: string;
}

/**
 * `GET /api/orders/:token` response — the envelope this page is built
 * around. Buyer Order Page, Seller Orders, and Admin Dispute Detail
 * all rely on this shape.
 */
export interface GetOrderResponse {
  order: ApiOrder;
  listing: ApiListing;
  seller: ApiSeller;
  /** Null when no dispute has been opened on this order. */
  dispute: ApiDispute | null;
}

/**
 * `POST /api/orders/:token/release` request body.
 *
 * The buyer's one-time Nostr private key, hex-encoded. The backend
 * forwards it to the Cashu mint to redeem the P2PK-locked token.
 *
 * SECURITY: this key has zero authority outside of releasing THIS
 * specific Cashu token. It is generated in the buyer's browser at
 * checkout, stored under `safesale:buyer:<orderToken>` in
 * localStorage, and read back here for release. See `src/lib/buyerKey.ts`.
 */
export interface ReleaseOrderRequest {
  buyerPrivateKeyHex: string;
}

export interface ReleaseOrderResponse {
  order: ApiOrder;
  redeemedSats: number;
  /** Backend-generated reference for receipts (e.g. "cashu_SS-7421"). */
  txRef: string;
}

/** `POST /api/orders/:token/ship` — seller-side. */
export interface ShipOrderRequest {
  trackingNumber?: string;
  carrier?: string;
}

export interface ShipOrderResponse {
  order: ApiOrder;
}

/** `POST /api/orders/:token/dispute` */
export interface OpenDisputeRequest {
  reason: string;
  summary?: string;
  openedBy: "buyer" | "seller";
}

export interface OpenDisputeResponse {
  order: ApiOrder;
  dispute: ApiDispute;
}
