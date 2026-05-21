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
  ApiOrder,
  CreateOrderRequest,
  CreateOrderResponse,
  OpenDisputeRequest,
  OpenDisputeResponse,
  ReleaseOrderRequest,
  ReleaseOrderResponse,
} from "./types";

export interface ApiClient {
  createOrder(req: CreateOrderRequest): Promise<CreateOrderResponse>;
  getOrder(token: string): Promise<ApiOrder>;
  releaseOrder(
    token: string,
    req: ReleaseOrderRequest,
  ): Promise<ReleaseOrderResponse>;
  openDispute(
    token: string,
    req: OpenDisputeRequest,
  ): Promise<OpenDisputeResponse>;
}

/** True when the real backend URL is configured. */
export const API_BACKEND_CONFIGURED: boolean =
  typeof import.meta.env.VITE_API_URL === "string" &&
  import.meta.env.VITE_API_URL.length > 0;

export const apiClient: ApiClient = API_BACKEND_CONFIGURED ? httpApi : mockApi;
