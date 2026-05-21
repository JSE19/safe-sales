/**
 * Mock implementations of the SafeSale API.
 *
 * Used by `apiClient` whenever `VITE_API_URL` is unset. Purpose:
 *
 *   1. Demos run cold with no backend reachable.
 *   2. Frontend can be built and shipped before the backend exists.
 *   3. A single env-var flip switches every component over to the real
 *      backend with no code changes.
 *
 * The shapes returned here **must** match what the real backend on
 * `origin/backend` returns. If a mock drifts, components break the
 * moment the env var is flipped — defeating the whole point. See
 * `./types.ts` for the contract.
 *
 * Mock state lives in module-scope `Map`s for the lifetime of the page.
 * Refreshing the browser resets it; that's fine for demo purposes.
 */

import type {
  ApiDispute,
  ApiListing,
  ApiOrder,
  ApiOrderStatus,
  ApiSeller,
  CreateOrderRequest,
  CreateOrderResponse,
  GetOrderResponse,
  OpenDisputeRequest,
  OpenDisputeResponse,
  ReleaseOrderRequest,
  ReleaseOrderResponse,
  ShipOrderRequest,
  ShipOrderResponse,
} from "./types";
import { ApiError } from "./errors";
import {
  currentSeller,
  generateOrderToken,
  getDisputeForOrder,
  getListing,
  getOrderByToken,
  getSeller,
} from "@/lib/mock";
import type { EscrowStatus } from "@/lib/types";

/* --------------------- in-memory order store (mock) -------------------- */

interface MockEnvelope {
  order: ApiOrder;
  listing: ApiListing;
  seller: ApiSeller;
  dispute: ApiDispute | null;
}

const memoryOrders = new Map<string, MockEnvelope>();

function nowIso(): string {
  return new Date().toISOString();
}

function isoIn(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

/**
 * Map the legacy frontend `EscrowStatus` to the canonical 7-value
 * backend `ApiOrderStatus`. The legacy enum had a few aliases
 * (`released`/`completed`, `resolved`, `expired`) that don't exist on
 * the backend — fold them down so fixtures behave like real backend rows.
 */
function normalizeStatus(status: EscrowStatus): ApiOrderStatus {
  switch (status) {
    case "released":
    case "completed":
      return "completed";
    case "resolved":
    case "disputed":
      return "disputed";
    case "expired":
      // Backend has no `expired` — treat as still pending payment, which
      // is what an expired Bitnob account effectively means client-side.
      return "pending_payment";
    default:
      return status;
  }
}

/**
 * Schedule a status transition for a mock order. Used to simulate the
 * Bitnob webhook landing ~5s after the buyer "confirms" they've paid.
 */
function transitionAfter(token: string, ms: number, next: ApiOrderStatus) {
  setTimeout(() => {
    const env = memoryOrders.get(token);
    if (!env) return;
    if (env.order.status === "pending_payment" && next === "payment_locked") {
      memoryOrders.set(token, {
        ...env,
        order: {
          ...env.order,
          status: next,
          updatedAt: nowIso(),
        },
      });
    }
  }, ms);
}

/* --------------------- fixture → API shape adapters -------------------- */

function fixtureSellerToApi(sellerId: string): ApiSeller {
  const s = getSeller(sellerId) ?? currentSeller;
  // Fixtures don't carry npub/pubkey/lnAddress. Synthesize stable
  // placeholders so the UI has something to render — they only need to
  // be present and well-typed; nothing in the buyer flow round-trips
  // them.
  return {
    id: s.id,
    npub: `npub1mockseller${s.id.replace(/[^a-z0-9]/gi, "").slice(0, 16)}`,
    pubkey: `mock-seller-pubkey-${s.id}`,
    handle: s.handle,
    name: s.name,
    location: s.location,
    category: s.category,
    bio: s.bio ?? null,
    verified: s.verified,
    lnAddress: null,
    createdAt: s.joinedAt,
  };
}

function fixtureListingToApi(listingId: string): ApiListing | null {
  const l = getListing(listingId);
  if (!l) return null;
  return {
    id: l.id,
    sellerId: l.sellerId,
    title: l.title,
    description: l.description,
    priceNGN: l.priceNGN,
    images: l.images.map((img) => ({ seed: img.seed, alt: img.label })),
    category: l.category,
    variants: l.variants ?? null,
    inStock: l.inStock,
    delivery: l.delivery,
    active: l.active,
    nostrEventId: null,
    createdAt: l.createdAt,
    updatedAt: l.createdAt,
  };
}

function fixtureDisputeToApi(orderId: string): ApiDispute | null {
  const d = getDisputeForOrder(orderId);
  if (!d) return null;
  return {
    id: d.id,
    orderId: d.orderId,
    reason: d.reason,
    summary: d.summary,
    openedBy: d.openedBy,
    priority: d.priority,
    status: d.status,
    directResolutionUntil: d.directResolutionUntil ?? null,
    evidenceDueAt: d.evidenceDueAt ?? null,
    isReturn: !!d.isReturn,
    returnEvidence: d.returnEvidence ?? null,
    resolution: d.resolution ?? null,
    createdAt: d.openedAt,
    resolvedAt: d.resolution?.resolvedAt ?? null,
  };
}

/**
 * Adapt one of the fixture orders in `src/lib/mock.ts` into the full
 * GetOrderResponse envelope the real backend returns.
 */
function fixtureEnvelope(token: string): MockEnvelope | null {
  const seed = getOrderByToken(token);
  if (!seed) return null;
  const listing = fixtureListingToApi(seed.listingId);
  if (!listing) return null;
  const seller = fixtureSellerToApi(seed.sellerId);

  const order: ApiOrder = {
    id: seed.id,
    shortId: seed.shortId,
    orderToken: seed.orderToken,
    listingId: seed.listingId,
    sellerId: seed.sellerId,
    buyerNpub: `npub1mockbuyer${seed.id.replace(/[^a-z0-9]/gi, "").slice(0, 16)}`,
    buyerPubkey: `mock-buyer-pk-${seed.id}`,
    buyerName: seed.buyerName,
    buyerPhone: seed.buyerPhone,
    buyerEmail: seed.buyerEmail ?? null,
    buyerCity: seed.buyerCity,
    buyerAddress: null,
    contactMethod: seed.contactMethod ?? "phone",
    variant: seed.variant ?? null,
    amountNGN: seed.amountNGN,
    amountSats: seed.amountSats,
    status: normalizeStatus(seed.status),
    bitnobAccount: "0123456789",
    bitnobBank: "Access Bank",
    trackingNumber: seed.trackingNumber ?? null,
    carrier: seed.carrier ?? null,
    shippedAt: seed.shippedAt ?? null,
    releasedAt: null,
    refundedAt: null,
    autoReleaseAt: seed.autoReleaseAt ?? null,
    expiresAt: seed.expiresAt ?? null,
    notes: seed.notes ?? null,
    createdAt: seed.createdAt,
    updatedAt: seed.updatedAt,
  };

  return {
    order,
    listing,
    seller,
    dispute: fixtureDisputeToApi(seed.id),
  };
}

/* ------------------------------ public API ----------------------------- */

export const mockApi = {
  async createOrder(req: CreateOrderRequest): Promise<CreateOrderResponse> {
    const listing = fixtureListingToApi(req.listingId);
    if (!listing) {
      throw new ApiError(
        "LISTING_NOT_FOUND",
        `No listing with id "${req.listingId}".`,
        404,
      );
    }

    const token = generateOrderToken();
    const shortId = "SS-" + Math.floor(Math.random() * 9000 + 1000).toString();
    const expiresAt = isoIn(24 * 60 * 60 * 1000);

    const seller = fixtureSellerToApi(listing.sellerId);

    const order: ApiOrder = {
      id: "mock_" + token.slice(0, 10),
      shortId,
      orderToken: token,
      listingId: listing.id,
      sellerId: listing.sellerId,
      buyerNpub: req.buyerNpub,
      // Without nostr-tools nip19.decode plumbed in here we can't derive
      // hex pubkey from npub safely in a mock; the buyer hex isn't used
      // by the mock release path so a placeholder is fine.
      buyerPubkey: `mock-buyer-pk-${token.slice(0, 8)}`,
      buyerName: req.buyerName,
      buyerPhone: req.buyerPhone,
      buyerEmail: req.buyerEmail ?? null,
      buyerCity: req.buyerCity,
      buyerAddress: req.buyerAddress ?? null,
      contactMethod: req.contactMethod ?? "phone",
      variant: req.variant ?? null,
      amountNGN: listing.priceNGN,
      // 1 sat ≈ 0.9 NGN per the backend's ngnToSats helper — keep mock
      // close to real so demos show realistic numbers.
      amountSats: Math.ceil(listing.priceNGN / 0.9),
      status: "pending_payment",
      bitnobAccount: "01" + Math.floor(Math.random() * 1e9).toString().padStart(8, "0").slice(0, 8),
      bitnobBank: "Wema Bank",
      trackingNumber: null,
      carrier: null,
      shippedAt: null,
      releasedAt: null,
      refundedAt: null,
      autoReleaseAt: null,
      expiresAt,
      notes: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    memoryOrders.set(token, {
      order,
      listing,
      seller,
      dispute: null,
    });

    // Mock the Bitnob webhook landing ~5s later.
    transitionAfter(token, 5000, "payment_locked");

    return {
      orderToken: token,
      shortId,
      bitnobAccount: order.bitnobAccount ?? "",
      bitnobBank: order.bitnobBank ?? "",
      amountNGN: order.amountNGN,
      expiresAt,
    };
  },

  async getOrder(token: string): Promise<GetOrderResponse> {
    // First check the in-memory store (orders the buyer just created in
    // this browser session). Fall back to fixture orders so deep-linked
    // demo URLs still work.
    const live = memoryOrders.get(token);
    if (live) return live;

    const fixture = fixtureEnvelope(token);
    if (fixture) {
      // Cache so subsequent mutations (release/dispute) hit the same row.
      memoryOrders.set(token, fixture);
      return fixture;
    }

    throw new ApiError(
      "ORDER_NOT_FOUND",
      `We couldn't find that order link.`,
      404,
    );
  },

  async releaseOrder(
    token: string,
    _req: ReleaseOrderRequest,
  ): Promise<ReleaseOrderResponse> {
    const env = memoryOrders.get(token) ?? fixtureEnvelope(token);
    if (!env) {
      throw new ApiError("ORDER_NOT_FOUND", "Order not found.", 404);
    }
    const { order } = env;
    if (order.status === "completed") {
      throw new ApiError(
        "ORDER_ALREADY_RELEASED",
        "This order has already been released.",
        409,
      );
    }
    if (
      order.status !== "shipped" &&
      order.status !== "delivered" &&
      order.status !== "payment_locked"
    ) {
      throw new ApiError(
        "ORDER_NOT_RELEASABLE",
        `Cannot release an order in status "${order.status}".`,
        409,
      );
    }
    const updated: ApiOrder = {
      ...order,
      status: "completed",
      releasedAt: nowIso(),
      updatedAt: nowIso(),
    };
    memoryOrders.set(token, { ...env, order: updated });
    return {
      order: updated,
      redeemedSats: updated.amountSats,
      txRef: `cashu_${updated.shortId}`,
    };
  },

  async openDispute(
    token: string,
    req: OpenDisputeRequest,
  ): Promise<OpenDisputeResponse> {
    const env = memoryOrders.get(token) ?? fixtureEnvelope(token);
    if (!env) {
      throw new ApiError("ORDER_NOT_FOUND", "Order not found.", 404);
    }
    if (env.dispute) {
      throw new ApiError(
        "DISPUTE_ALREADY_OPEN",
        "A dispute is already open for this order.",
        409,
      );
    }
    const updatedOrder: ApiOrder = {
      ...env.order,
      status: "disputed",
      updatedAt: nowIso(),
    };
    const dispute: ApiDispute = {
      id: "dsp_mock_" + token.slice(0, 6),
      orderId: env.order.id,
      reason: req.reason,
      summary: req.summary ?? null,
      openedBy: req.openedBy,
      priority: "medium",
      status: "direct_resolution",
      directResolutionUntil: isoIn(72 * 60 * 60 * 1000),
      evidenceDueAt: null,
      isReturn: false,
      returnEvidence: null,
      resolution: null,
      createdAt: nowIso(),
      resolvedAt: null,
    };
    memoryOrders.set(token, {
      ...env,
      order: updatedOrder,
      dispute,
    });
    return { order: updatedOrder, dispute };
  },

  async shipOrder(
    token: string,
    req: ShipOrderRequest,
  ): Promise<ShipOrderResponse> {
    const env = memoryOrders.get(token) ?? fixtureEnvelope(token);
    if (!env) {
      throw new ApiError("ORDER_NOT_FOUND", "Order not found.", 404);
    }
    if (env.order.status !== "payment_locked") {
      throw new ApiError(
        "INVALID_REQUEST",
        `Cannot ship an order in status "${env.order.status}".`,
        409,
      );
    }
    const shippedAt = nowIso();
    const updated: ApiOrder = {
      ...env.order,
      status: "shipped",
      shippedAt,
      autoReleaseAt: isoIn(7 * 24 * 60 * 60 * 1000),
      trackingNumber: req.trackingNumber ?? null,
      carrier: req.carrier ?? null,
      updatedAt: shippedAt,
    };
    memoryOrders.set(token, { ...env, order: updated });
    return { order: updated };
  },
};
