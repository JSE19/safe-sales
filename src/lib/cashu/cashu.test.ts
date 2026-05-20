/**
 * Cashu module sanity tests. These are pure / offline — they don't hit
 * a real mint. Integration tests against a live mint live elsewhere.
 */

import { describe, it, expect } from "vitest";

import {
  DEFAULT_MINT_URL,
  ESCROW_TIMEOUT_SECONDS,
  SUPPORTED_MINTS,
} from "./types";

describe("cashu module constants", () => {
  it("exposes a non-empty list of supported mints", () => {
    expect(SUPPORTED_MINTS.length).toBeGreaterThan(0);
    for (const url of SUPPORTED_MINTS) {
      expect(url).toMatch(/^https?:\/\//);
    }
  });

  it("defaults to the first supported mint", () => {
    expect(DEFAULT_MINT_URL).toBe(SUPPORTED_MINTS[0]);
  });

  it("uses a 7-day escrow timeout", () => {
    expect(ESCROW_TIMEOUT_SECONDS).toBe(7 * 24 * 60 * 60);
  });
});
