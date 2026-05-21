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
 * These mocks are intentionally simple. They use the existing fixtures
 * in `src/lib/mock.ts` and maintain a small per-token state machine in
 * memory so flows like "payment detected" still happen on a timer.
 */

import type {
  ApiOrder,
  ApiOrderStatus,
  CreateOrderRequest,
  CreateOrderResponse,
  OpenDisputeRequest,
  OpenDisputeResponse,
  ReleaseOrderRequest,
  ReleaseOrderResponse,
} from "./types";
import { ApiError } from "./errors";
import {
  currentSeller,
  generateOrderToken,
  getListing,
  getOrderByToken,
} from "@/lib/mock";

/* --------------------- in-memory order store (mock) -------------------- */

const memoryOrders = new Map<string, ApiOrder>();

function nowIso(): string {
  return new Date().toISOString();
}

function isoIn(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

/**
 * Schedule a status transition for a mock order. Used to simulate the
 * Bitnob webhook landing ~5s after the buyer "confirms" they've paid.
 */
function transitionAfter(token: string, ms: number, next: ApiOrderStatus) {
  setTimeout(() => {
    const order = memoryOrders.get(token);
    if (!order) return;
    if (order.status === "pending_payment" && next === "payment_locked") {
      memoryOrders.set(token, {
        ...order,
        status: next,
        paidAt: nowIso(),
        lockedAt: nowIso(),
        updatedAt: nowIso(),
        cashuTokenHash:
          "mock-token-hash-" + Math.random().toString(36).slice(2, 10),
      });
    }
  }, ms);
}

/* -------------------- helpers to build ApiOrder shape ------------------ */

/**
 * Best-effort conversion of one of our seed mock orders (from
 * `src/lib/mock.ts`) into the BACKEND.md `ApiOrder` shape. Used when
 * the buyer opens a fixture order URL like `/order/k7xq2m9a4npb3hv8yw5jc6`.
 */
function fixtureOrderToApi(token: string): ApiOrder | null {
  const seed = getOrderByToken(token);
  if (!seed) return null;
  const listing = getListing(seed.listingId);
  // Map our legacy "completed" status to backend's "released".
  const status: ApiOrderStatus =
    seed.status === "completed" ? "released" : (seed.status as ApiOrderStatus);
  return {
    id: seed.id,
    token: seed.orderToken,
    status,
    listingCoord: listing
      ? `30018:${currentSeller.id}:${listing.id}`
      : `30018:${currentSeller.id}:unknown`,
    sellerPubkey: currentSeller.id,
    buyerPubkey: "mock-buyer-pk-" + seed.id,
    amountNGN: seed.amountNGN,
    amountSats: seed.amountSats,
    mintUrl:
      import.meta.env.VITE_DEFAULT_MINT_URL ?? "https://mint.nutshell.cash",
    cashuTokenHash:
      status === "pending_payment"
        ? undefined
        : "mock-fixture-" + seed.id,
    p2pkPubkey:
      status === "pending_payment" ? undefined : "mock-p2pk-" + seed.id,
    carrier: seed.carrier,
    trackingNumber: seed.trackingNumber,
    buyerContactHint:
      seed.contactMethod === "email"
        ? maskEmail(seed.buyerEmail ?? "")
        : maskPhone(seed.buyerPhone ?? ""),
    createdAt: seed.createdAt,
    updatedAt: seed.updatedAt,
    shippedAt: seed.shippedAt,
    deliveredAt: seed.deliveredAt,
    autoReleaseAt: seed.autoReleaseAt,
    bitnobExpiresAt: seed.expiresAt,
  };
}

function maskEmail(email: string): string {
  if (!email.includes("@")) return email;
  const [local, domain] = email.split("@");
  if (local.length <= 1) return `${local}***@${domain}`;
  return `${local[0]}***@${domain}`;
}

function maskPhone(phone: string): string {
  const trimmed = phone.replace(/\s+/g, "");
  if (trimmed.length < 4) return trimmed;
  return trimmed.slice(0, -4).replace(/\d/g, "•") + trimmed.slice(-4);
}

/* ---------------------------- public API ------------------------------ */

export const mockApi = {
  async createOrder(req: CreateOrderRequest): Promise<CreateOrderResponse> {
    // Extract the listing UUID from the coordinate "30018:<pk>:<d>"
    const dTag = req.listingCoord.split(":")[2];
    const listing = dTag ? getListing(dTag) : undefined;
    if (!listing) {
      throw new ApiError(
        "LISTING_NOT_FOUND",
        `No listing with id "${dTag}".`,
        404,
      );
    }

    const token = generateOrderToken();
    const order: ApiOrder = {
      id: "mock_" + token.slice(0, 10),
      token,
      status: "pending_payment",
      listingCoord: req.listingCoord,
      sellerPubkey: currentSeller.id,
      buyerPubkey:
        req.buyerPubkey ?? "mock-buyer-pk-" + token.slice(0, 8),
      amountNGN: listing.priceNGN,
      // 1 sat ≈ 0.91 NGN at hackathon-time rough rate; close enough for demo
      amountSats: Math.round(listing.priceNGN * 1.1),
      mintUrl:
        import.meta.env.VITE_DEFAULT_MINT_URL ?? "https://mint.nutshell.cash",
      bitnob: {
        accountNumber: "01" + Math.floor(Math.random() * 1e9).toString().padStart(8, "0").slice(0, 8),
        bankName: "Wema Bank",
        accountName: "SafeSale Escrow",
        expiresAt: isoIn(24 * 60 * 60 * 1000),
      },
      buyerContactHint:
        req.contactChannel === "email"
          ? maskEmail(req.buyerContact)
          : maskPhone(req.buyerContact),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      bitnobExpiresAt: isoIn(24 * 60 * 60 * 1000),
    };

    memoryOrders.set(token, order);

    // Mock the Bitnob webhook landing ~5s later.
    transitionAfter(token, 5000, "payment_locked");

    const orderUrl = `${import.meta.env.VITE_APP_URL ?? window.location.origin}/order/${token}`;

    return {
      order: { ...order, orderUrl },
      // No buyer keypair in mock mode — the demo assumes the buyer
      // already has one (or is using the seller's nsec for demo flows).
    };
  },

  async getOrder(token: string): Promise<ApiOrder> {
    // First check the in-memory store (orders the buyer just created in
    // this browser session). Fall back to fixture orders so deep-linked
    // demo URLs still work.
    const live = memoryOrders.get(token);
    if (live) return live;

    const fixture = fixtureOrderToApi(token);
    if (fixture) return fixture;

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
    const order = memoryOrders.get(token) ?? fixtureOrderToApi(token);
    if (!order) {
      throw new ApiError("ORDER_NOT_FOUND", "Order not found.", 404);
    }
    if (order.status === "released") {
      throw new ApiError(
        "ORDER_ALREADY_RELEASED",
        "This order has already been released.",
        409,
      );
    }
    if (order.status !== "shipped" && order.status !== "delivered") {
      throw new ApiError(
        "ORDER_NOT_RELEASABLE",
        "You can only release after the seller has shipped.",
        409,
      );
    }
    const updated: ApiOrder = {
      ...order,
      status: "released",
      releasedAt: nowIso(),
      updatedAt: nowIso(),
    };
    memoryOrders.set(token, updated);
    return { order: updated };
  },

  async openDispute(
    token: string,
    _req: OpenDisputeRequest,
  ): Promise<OpenDisputeResponse> {
    const order = memoryOrders.get(token) ?? fixtureOrderToApi(token);
    if (!order) {
      throw new ApiError("ORDER_NOT_FOUND", "Order not found.", 404);
    }
    if (order.status === "disputed" || order.status === "resolved") {
      throw new ApiError(
        "DISPUTE_ALREADY_OPEN",
        "A dispute is already open for this order.",
        409,
      );
    }
    const updated: ApiOrder = {
      ...order,
      status: "disputed",
      updatedAt: nowIso(),
    };
    memoryOrders.set(token, updated);
    return {
      order: updated,
      dispute: {
        id: "dsp_mock_" + token.slice(0, 6),
        status: "open",
        openedAt: nowIso(),
      },
    };
  },
};
