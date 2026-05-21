/**
 * SafeSale API — barrel export.
 *
 *   import { apiClient, ApiError } from "@/lib/api";
 *
 * The client implementation (real HTTP or in-memory mock) is chosen at
 * module load based on `VITE_API_URL`. Components should never import
 * from `./http` or `./mocks` directly.
 */

export { apiClient, API_BACKEND_CONFIGURED } from "./client";
export type { ApiClient } from "./client";
export { ApiError } from "./errors";
export type { ApiErrorCode } from "./errors";
export type {
  ApiOrder,
  ApiOrderStatus,
  ApiBitnobAccount,
  CreateOrderRequest,
  CreateOrderResponse,
  ReleaseOrderRequest,
  ReleaseOrderResponse,
  OpenDisputeRequest,
  OpenDisputeResponse,
} from "./types";
