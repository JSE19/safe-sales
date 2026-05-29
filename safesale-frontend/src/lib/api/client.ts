/**
 * SafeSale API client.
 *
 * Exposes the same surface (`createOrder`, `getOrder`, ...) regardless
 * of mode. Mode is chosen at module load:
 *
 *   - `VITE_API_URL` set   → real HTTP client → talks to the backend
 *   - `VITE_API_URL` unset → mock client      → in-memory fixtures
 *
 * Components import `apiClient` and never branch on the mode. This is
 * the seam that lets the frontend ship and demo before the backend
 * exists, then drop into the real backend with one env-var flip.
 */

import { httpApi } from "./http";
import { mockApi } from "./mocks";
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

export interface ApiClient {
  /** POST /api/sellers — register a new seller from their Nostr identity. */
  createSeller(req: CreateSellerRequest): Promise<CreateSellerResponse>;
  /** POST /api/listings — seller publishes a new listing. */
  createListing(req: CreateListingRequest): Promise<CreateListingResponse>;
  /** GET /api/orders/seller/:npub — seller dashboard orders feed. */
  getSellerOrders(npub: string): Promise<GetSellerOrdersResponse>;
  /** POST /api/orders — buyer initiates a purchase. */
  createOrder(req: CreateOrderRequest): Promise<CreateOrderResponse>;
  /** GET /api/orders/:token — buyer order page envelope. */
  getOrder(token: string): Promise<GetOrderResponse>;
  /** POST /api/orders/:token/release — buyer releases the escrow. */
  releaseOrder(
    token: string,
    req: ReleaseOrderRequest,
  ): Promise<ReleaseOrderResponse>;
  /** POST /api/orders/:token/dispute — buyer or seller opens a dispute. */
  openDispute(
    token: string,
    req: OpenDisputeRequest,
  ): Promise<OpenDisputeResponse>;
  /** POST /api/orders/:token/ship — seller marks the order shipped. */
  shipOrder(token: string, req: ShipOrderRequest): Promise<ShipOrderResponse>;
  /** GET /api/admin/disputes — mediator dispute queue (demo: served from mock store). */
  getDisputes(): Promise<GetDisputesResponse>;
  /** POST /api/admin/disputes/:id/resolve — mediator signs an outcome. */
  resolveDispute(
    orderToken: string,
    req: ResolveDisputeRequest,
  ): Promise<ResolveDisputeResponse>;
}

/** True when the real backend URL is configured. */
export const API_BACKEND_CONFIGURED: boolean =
  typeof import.meta.env.VITE_API_URL === "string" &&
  import.meta.env.VITE_API_URL.length > 0;

/**
 * Demo mode. When `VITE_DEMO_MODE=true`, every call is served by the
 * in-memory mock client regardless of whether a backend URL is set — a
 * single switch for a reliable judges' demo that never touches the flaky
 * Cashu test mint. It also unlocks `/admin` (see MediatorGate) and seeds
 * believable data. Set it back to `false` (or remove it) to use the real
 * Railway backend.
 */
export const DEMO_MODE: boolean = import.meta.env.VITE_DEMO_MODE === "true";

export const apiClient: ApiClient =
  DEMO_MODE || !API_BACKEND_CONFIGURED ? mockApi : httpApi;
