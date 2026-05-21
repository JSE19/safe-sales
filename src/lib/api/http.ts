/**
 * SafeSale HTTP API — real (fetch) implementation.
 *
 * Hits the backend defined in `BACKEND.md`. Activated by setting
 * `VITE_API_URL`; the toggle lives in `client.ts`.
 *
 * All methods reject with `ApiError` on non-2xx. The backend's error
 * envelope is `{ error: { code, message } }` — we surface those fields
 * verbatim so the UI can render `err.message` directly.
 *
 * Auth: buyer endpoints are public (token in URL is the credential).
 * Seller endpoints will need NIP-98 signed-event headers (added in a
 * later commit when seller wiring lands).
 */

import type {
  ApiOrder,
  CreateOrderRequest,
  CreateOrderResponse,
  OpenDisputeRequest,
  OpenDisputeResponse,
  ReleaseOrderRequest,
  ReleaseOrderResponse,
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
    const envelope = payload as { error?: { code?: string; message?: string } } | null;
    const code = envelope?.error?.code ?? "UNKNOWN";
    const message =
      envelope?.error?.message ?? `Request failed (HTTP ${res.status}).`;
    throw new ApiError(code, message, res.status);
  }

  return payload as T;
}

export const httpApi = {
  createOrder(req: CreateOrderRequest): Promise<CreateOrderResponse> {
    return request<CreateOrderResponse>("POST", "/api/orders", req);
  },
  getOrder(token: string): Promise<ApiOrder> {
    return request<ApiOrder>("GET", `/api/orders/${encodeURIComponent(token)}`);
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
};
