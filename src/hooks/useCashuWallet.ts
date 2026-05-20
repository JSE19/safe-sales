/**
 * `useCashuWallet` — React hook that lazily connects to a Cashu mint
 * and exposes a ready wallet instance plus loading/error state.
 *
 * Frontend-only. The wallet itself is stateless; persistence of proofs
 * (the bearer money) is the responsibility of higher-level hooks like
 * `useEscrowToken` that will be added once the buyer/seller flows land.
 *
 * Example:
 *   const { wallet, isLoading, error } = useCashuWallet();
 *   if (!wallet) return <Skeleton />;
 *   const preview = previewToken(encoded);
 */

import { useEffect, useRef, useState } from "react";
import type { Wallet } from "@cashu/cashu-ts";

import { createWallet, DEFAULT_MINT_URL } from "@/lib/cashu";

export interface UseCashuWalletState {
  wallet: Wallet | null;
  isLoading: boolean;
  error: Error | null;
}

export function useCashuWallet(
  mintUrl: string = DEFAULT_MINT_URL,
): UseCashuWalletState {
  const [state, setState] = useState<UseCashuWalletState>({
    wallet: null,
    isLoading: true,
    error: null,
  });

  // Track the in-flight mint URL so a fast url switch doesn't race a stale promise.
  const inFlightUrl = useRef<string | null>(null);

  useEffect(() => {
    inFlightUrl.current = mintUrl;
    let cancelled = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ wallet: null, isLoading: true, error: null });

    createWallet(mintUrl)
      .then((wallet) => {
        if (cancelled || inFlightUrl.current !== mintUrl) return;
        setState({ wallet, isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled || inFlightUrl.current !== mintUrl) return;
        setState({
          wallet: null,
          isLoading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [mintUrl]);

  return state;
}
