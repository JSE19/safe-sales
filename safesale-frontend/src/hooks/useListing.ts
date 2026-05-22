/**
 * `useListing(id)` — fetch a SafeSale product listing by its UUID.
 *
 * Per NIP.md kind 30018 is NIP-15 marketplace listing. The `d` tag
 * holds the listing UUID and is what we use as the URL slug at
 * `safesale.app/buy/<id>`.
 *
 * Returns:
 *   - data: a parsed `NostrListing` with seller pubkey + structured tags
 *   - isLoading, error: from TanStack Query
 *
 * Behaviour:
 *
 *   1. Queries `{ kinds: [30018], '#d': [id], limit: 1 }` against the
 *      relay pool (1.5s timeout, mirroring useAuthor).
 *
 *   2. Validates the event has the tags the UI depends on (`d`, `title`,
 *      at least one `image`, a `price`). Events failing validation are
 *      treated the same as no event.
 *
 *   3. If no valid event comes back, falls back to a fixture listing
 *      from `src/lib/mock.ts` so demos run cold with no relays
 *      reachable. The fixture is wrapped in the same NostrListing
 *      shape so the consuming UI doesn't branch.
 *
 * Trust model: listings are public UGC (per nostr-security guidance,
 * no author filtering required). The seller's identity is published
 * via the event's `pubkey` field — consumers use that with
 * `useAuthor()` to render seller name + verification.
 */

import type { NostrEvent } from "@nostrify/nostrify";
import { useNostr } from "@nostrify/react";
import { useQuery } from "@tanstack/react-query";

import { getListing as getFixtureListing, getSeller } from "@/lib/mock";

export interface NostrListing {
  /** The UUID from the `d` tag — same as the URL slug. */
  id: string;
  /** Hex pubkey of the seller (event author). */
  sellerPubkey: string;
  title: string;
  summary?: string;
  /** Long-form Markdown description from the event content. */
  description: string;
  /** Image URLs (`image` tags). At least one. */
  images: string[];
  /** Price in NGN (integer naira). */
  priceNGN: number;
  /** Optional sats price cached at publish time. UI may recompute live. */
  priceSats?: number;
  /** From the `stock` tag. `out` → 0; missing → 1 per NIP.md. */
  inStock: number;
  category?: string;
  /** Free-form `t` tags. */
  tags: string[];
  /** Optional `delivery` tag (joined). */
  delivery?: string;
  /** Unix seconds — `published_at` tag or `created_at` of the event. */
  publishedAt: number;
  /** True when this came from the local fixture, not a relay. */
  fromFixture: boolean;
  /** The raw event, when available (null when from fixture). */
  event: NostrEvent | null;
}

/* ------------------------------ parsing ------------------------------- */

function getTag(event: NostrEvent, name: string): string | undefined {
  const t = event.tags.find(([n]) => n === name);
  return t?.[1];
}

function getTagValues(event: NostrEvent, name: string): string[] {
  return event.tags.filter(([n]) => n === name).map(([, v]) => v).filter(Boolean);
}

function parseStock(raw: string | undefined): number {
  if (!raw) return 1;
  if (raw === "out") return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 1;
}

function parseListingEvent(event: NostrEvent): NostrListing | null {
  const id = getTag(event, "d");
  const title = getTag(event, "title");
  const images = getTagValues(event, "image");
  const priceTag = event.tags.find(([n]) => n === "price");

  if (!id || !title || images.length === 0 || !priceTag) return null;

  const priceRaw = priceTag[1];
  const priceNGN = Number.parseInt(priceRaw, 10);
  if (!Number.isFinite(priceNGN) || priceNGN <= 0) return null;

  const priceSatsRaw = getTag(event, "price_sats");
  const priceSats = priceSatsRaw ? Number.parseInt(priceSatsRaw, 10) : undefined;

  const publishedAtRaw = getTag(event, "published_at");
  const publishedAt = publishedAtRaw
    ? Number.parseInt(publishedAtRaw, 10)
    : event.created_at;

  const deliveryTag = event.tags.find(([n]) => n === "delivery");
  const delivery = deliveryTag
    ? deliveryTag.slice(1).filter(Boolean).join(" · ")
    : undefined;

  return {
    id,
    sellerPubkey: event.pubkey,
    title,
    summary: getTag(event, "summary"),
    description: event.content,
    images,
    priceNGN,
    priceSats:
      priceSats !== undefined && Number.isFinite(priceSats) ? priceSats : undefined,
    inStock: parseStock(getTag(event, "stock")),
    category: getTag(event, "category"),
    tags: getTagValues(event, "t"),
    delivery,
    publishedAt,
    fromFixture: false,
    event,
  };
}

/* ----------------------- fixture fallback (demo) ---------------------- */

function fixtureListing(id: string): NostrListing | null {
  const listing = getFixtureListing(id);
  if (!listing) return null;
  const seller = getSeller(listing.sellerId);
  return {
    id: listing.id,
    sellerPubkey: seller?.id ?? listing.sellerId,
    title: listing.title,
    summary: undefined,
    description: listing.description,
    // Fixtures use seeded placeholder images; the renderer (ProductImage)
    // already knows how to handle the seed-based shape, but for the
    // NostrListing contract we want URL strings only. Synthesize a
    // unique deterministic "URL" per seed so anything URL-typed still
    // gets a stable, distinct value.
    images: listing.images.map(
      (img) => `safesale://fixture-image/${listing.id}/${img.seed}`,
    ),
    priceNGN: listing.priceNGN,
    priceSats: undefined,
    inStock: listing.inStock,
    category: listing.category.toLowerCase(),
    tags: listing.variants ?? [],
    delivery: listing.delivery,
    publishedAt: Math.floor(new Date(listing.createdAt).getTime() / 1000),
    fromFixture: true,
    event: null,
  };
}

/* --------------------------------- hook -------------------------------- */

export function useListing(id: string | undefined) {
  const { nostr } = useNostr();

  return useQuery<NostrListing | null>({
    queryKey: ["safesale", "listing", id ?? ""],
    queryFn: async () => {
      if (!id) return null;

      let event: NostrEvent | undefined;
      try {
        const events = await nostr.query(
          [{ kinds: [30018], "#d": [id], limit: 1 }],
          { signal: AbortSignal.timeout(1500) },
        );
        event = events[0];
      } catch {
        // Relay errors fall through to the fixture fallback.
      }

      if (event) {
        const parsed = parseListingEvent(event);
        if (parsed) return parsed;
      }

      // No valid event found on relays — fall back to fixtures so demos
      // work even when offline / no relays reachable.
      return fixtureListing(id);
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
}
