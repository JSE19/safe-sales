/**
 * `useEscrowToken` — React hook that manages a SafeSale escrow token's
 * lifecycle on the **frontend**.
 *
 * Three responsibilities:
 *   1. Preview an incoming locked token before redemption ("you are
 *      about to release 12,500 sats to @amaka")
 *   2. Persist locked-token *hashes* + metadata to localStorage so the
 *      buyer's order page survives a browser reload
 *   3. Drive the release flow: take the buyer's secret key, swap the
 *      P2PK-locked proofs at the mint, and return the freshly-owned
 *      proofs to the caller (the seller, in the redemption case)
 *
 * Important: this hook never persists raw cashu tokens or secret keys
 * to localStorage. Those live elsewhere (the buyer's nsec is held by
 * the `@nostrify/react/login` session). What it stores is the
 * order-metadata bag plus the token hash for display continuity.
 */

import { useCallback, useEffect, useState } from "react";
import type { Proof } from "@cashu/cashu-ts";

import {
  previewToken,
  receiveEscrowToken,
  type SafeSaleEscrowToken,
  type TokenPreview,
} from "@/lib/cashu";
import { useCashuWallet } from "@/hooks/useCashuWallet";

/**
 * Persisted shape of an escrow token reference. We do NOT serialise the
 * raw `proofs` — those are bearer money. Instead we persist the encoded
 * token string + hash + display metadata so the UI can render the order
 * page without re-fetching from the network.
 */
interface PersistedEscrow {
  orderToken: string;
  encodedToken: string;
  tokenHash: string;
  mintUrl: string;
  amountSats: number;
  lockedToPubkey: string;
  locktimeSeconds: number;
  status: "locked" | "released" | "refunded";
  updatedAt: number;
}

interface UseEscrowTokenResult {
  /** Display-safe metadata for the current order. */
  preview: TokenPreview | null;
  /** Persisted snapshot if one exists for this order. */
  persisted: PersistedEscrow | null;
  /** Loading state for the underlying Cashu wallet. */
  isLoading: boolean;
  /** Error from the most recent operation, if any. */
  error: Error | null;
  /**
   * Persist a freshly-locked token to localStorage. Call this once the
   * buyer has locked their sats so the order page is retrievable after
   * a reload.
   */
  saveLocked: (token: SafeSaleEscrowToken, orderToken: string) => void;
  /**
   * Release the token to the recipient by signing the P2PK unlock.
   * Returns the proofs the recipient now owns — caller must persist
   * them in their own wallet.
   */
  release: (privkey: string) => Promise<Proof[]>;
  /** Forget the locally-cached metadata. Does not affect the mint. */
  forget: () => void;
}

const STORAGE_PREFIX = "safesale:escrow:";

export function useEscrowToken(orderToken: string): UseEscrowTokenResult {
  const [persisted, setPersisted] = useState<PersistedEscrow | null>(() =>
    loadFromStorage(orderToken),
  );
  const [preview, setPreview] = useState<TokenPreview | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Decode the persisted token into display metadata as soon as we have it.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!persisted) {
      setPreview(null);
      return;
    }
    try {
      setPreview(previewToken(persisted.encodedToken));
      setError(null);
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err : new Error(String(err)));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [persisted]);

  const { wallet, isLoading: walletLoading } = useCashuWallet(
    persisted?.mintUrl,
  );

  const saveLocked = useCallback(
    (token: SafeSaleEscrowToken, oToken: string) => {
      const record: PersistedEscrow = {
        orderToken: oToken,
        encodedToken: token.encodedToken,
        tokenHash: token.tokenHash,
        mintUrl: token.mintUrl,
        amountSats: token.amountSats,
        lockedToPubkey: token.lockedToPubkey,
        locktimeSeconds: token.locktimeSeconds,
        status: "locked",
        updatedAt: Date.now(),
      };
      saveToStorage(record);
      setPersisted(record);
    },
    [],
  );

  const release = useCallback(
    async (privkey: string): Promise<Proof[]> => {
      if (!persisted) {
        throw new Error("No escrow token to release for this order.");
      }
      if (!wallet) {
        throw new Error(
          "Cashu wallet not ready yet — please wait for the mint to load.",
        );
      }
      try {
        const proofs = await receiveEscrowToken(
          wallet,
          persisted.encodedToken,
          privkey,
        );
        const next: PersistedEscrow = {
          ...persisted,
          status: "released",
          updatedAt: Date.now(),
        };
        saveToStorage(next);
        setPersisted(next);
        setError(null);
        return proofs;
      } catch (err) {
        const wrapped = err instanceof Error ? err : new Error(String(err));
        setError(wrapped);
        throw wrapped;
      }
    },
    [persisted, wallet],
  );

  const forget = useCallback(() => {
    removeFromStorage(orderToken);
    setPersisted(null);
    setPreview(null);
    setError(null);
  }, [orderToken]);

  return {
    preview,
    persisted,
    isLoading: walletLoading,
    error,
    saveLocked,
    release,
    forget,
  };
}

/* -------------------------- storage helpers -------------------------- */

function loadFromStorage(orderToken: string): PersistedEscrow | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + orderToken);
    return raw ? (JSON.parse(raw) as PersistedEscrow) : null;
  } catch {
    return null;
  }
}

function saveToStorage(record: PersistedEscrow) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_PREFIX + record.orderToken,
    JSON.stringify(record),
  );
}

function removeFromStorage(orderToken: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_PREFIX + orderToken);
}
