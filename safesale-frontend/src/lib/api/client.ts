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
  GetOrderResponse,
  GetSellerOrdersResponse,
  OpenDisputeRequest,
  OpenDisputeResponse,
  ReleaseOrderRequest,
  ReleaseOrderResponse,
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
}

/** True when the real backend URL is configured. */
export const API_BACKEND_CONFIGURED: boolean =
  typeof import.meta.env.VITE_API_URL === "string" &&
  import.meta.env.VITE_API_URL.length > 0;

export const apiClient: ApiClient = API_BACKEND_CONFIGURED ? httpApi : mockApi;
