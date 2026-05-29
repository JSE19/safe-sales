/**
 * SafeSale HTTP API — real (fetch) implementation.
 *
 * Hits the backend running on `origin/backend` (Fastify + Prisma).
 * Activated by setting `VITE_API_URL`; the toggle lives in `client.ts`.
 *
 * All methods reject with `ApiError` on non-2xx. The backend's error
 * envelope per `backend/src/lib/errors.ts` is `{ message, code? }` at
 * the top level — we accept both that shape and the older
 * `{ error: { code, message } }` envelope for forward compatibility.
 *
 * Auth: buyer endpoints are public (the orderToken in the URL IS the
 * auth). Seller endpoints will need NIP-98 signed-event headers (added
 * in a later commit when seller wiring lands).
 */

import type {
  CreateListingRequest,
  CreateListingResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  CreateSellerRequest,
  CreateSellerResponse,
  GetDisputesResponse,
  GetOrderResponse,
  GetSellerOrdersResponse,
  OpenDisputeRequest,
  OpenDisputeResponse,
  ReleaseOrderRequest,
  ReleaseOrderResponse,
  ResolveDisputeRequest,
  ResolveDisputeResponse,
  ShipOrderRequest,
  ShipOrderResponse,
} from "./types";
import { ApiError } from "./errors";

function getBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  if (!url || typeof url !== "string") {
    // The mock client should have intercepted this — defensive.
    throw new ApiError(
      "BACKEND_UNREACHABLE",
      "VITE_API_URL is not configured.",
    );
  }
  return url.replace(/\/$/, "");
}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<T> {
  const url = getBaseUrl() + path;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (cause) {
    throw new ApiError(
      "BACKEND_UNREACHABLE",
      cause instanceof Error
        ? `Could not reach the SafeSale backend: ${cause.message}`
        : "Could not reach the SafeSale backend.",
    );
  }

  // Empty body on 204 is fine
  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new ApiError(
        "UNKNOWN",
        `Backend returned non-JSON response (HTTP ${res.status}).`,
        res.status,
      );
    }
  }

  if (!res.ok) {
    // Accept both envelope shapes — the Fastify backend on origin/backend
    // currently throws HttpError which serializes as { message, statusCode };
    // an older draft used { error: { code, message } }. Handle both.
    const flat = payload as { message?: string; code?: string } | null;
    const nested = payload as { error?: { code?: string; message?: string } } | null;
    const code = flat?.code ?? nested?.error?.code ?? "UNKNOWN";
    const message =
      flat?.message ??
      nested?.error?.message ??
      `Request failed (HTTP ${res.status}).`;
    throw new ApiError(code, message, res.status);
  }

  return payload as T;
}

export const httpApi = {
  createSeller(req: CreateSellerRequest): Promise<CreateSellerResponse> {
    return request<CreateSellerResponse>("POST", "/api/sellers", req);
  },
  createListing(req: CreateListingRequest): Promise<CreateListingResponse> {
    return request<CreateListingResponse>("POST", "/api/listings", req);
  },
  getSellerOrders(npub: string): Promise<GetSellerOrdersResponse> {
    return request<GetSellerOrdersResponse>(
      "GET",
      `/api/orders/seller/${encodeURIComponent(npub)}`,
    );
  },
  createOrder(req: CreateOrderRequest): Promise<CreateOrderResponse> {
    // Strip mock-only fields before sending over the wire. The real
    // backend has no notion of `_listingHint`; the listing already
    // exists in its Postgres DB from the seller's POST /api/listings.
    const { _listingHint: _hint, ...body } = req;
    return request<CreateOrderResponse>("POST", "/api/orders", body);
  },
  getOrder(token: string): Promise<GetOrderResponse> {
    return request<GetOrderResponse>(
      "GET",
      `/api/orders/${encodeURIComponent(token)}`,
    );
  },
  releaseOrder(
    token: string,
    req: ReleaseOrderRequest,
  ): Promise<ReleaseOrderResponse> {
    return request<ReleaseOrderResponse>(
      "POST",
      `/api/orders/${encodeURIComponent(token)}/release`,
      req,
    );
  },
  openDispute(
    token: string,
    req: OpenDisputeRequest,
  ): Promise<OpenDisputeResponse> {
    return request<OpenDisputeResponse>(
      "POST",
      `/api/orders/${encodeURIComponent(token)}/dispute`,
      req,
    );
  },
  shipOrder(
    token: string,
    req: ShipOrderRequest,
  ): Promise<ShipOrderResponse> {
    return request<ShipOrderResponse>(
      "POST",
      `/api/orders/${encodeURIComponent(token)}/ship`,
      req,
    );
  },
  getDisputes(): Promise<GetDisputesResponse> {
    // The live backend has the Dispute table but no admin queue endpoint
    // shipped yet. Surface a clear error rather than a silent empty queue;
    // the mediator dashboard is meant to run in demo mode (VITE_DEMO_MODE=true).
    return Promise.reject(
      new ApiError(
        "NOT_AVAILABLE",
        "Admin dispute queue isn't wired on the live backend yet. Run the demo with VITE_DEMO_MODE=true.",
      ),
    );
  },
  resolveDispute(): Promise<ResolveDisputeResponse> {
    return Promise.reject(
      new ApiError(
        "NOT_AVAILABLE",
        "Dispute resolution isn't wired on the live backend yet. Run the demo with VITE_DEMO_MODE=true.",
      ),
    );
  },
};
