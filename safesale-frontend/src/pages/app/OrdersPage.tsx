/**
 * Seller Orders — `/app/orders`.
 *
 * The seller's full order feed, filterable and searchable. Reads from
 * the live backend via `useSellerOrders()` (GET /api/orders/seller/:npub)
 * so this page agrees with the dashboard at all times — both surfaces
 * key off the same TanStack Query cache and refresh together.
 *
 * Each row links to `/app/orders/<orderToken>` (the seller order detail
 * page, also fully wired in Phase 8 step C).
 *
 * Previous version of this file pulled from `lib/mock.ts` fixtures —
 * confusing because the dashboard claimed "3 orders to ship" while
 * this list showed entirely different fixture orders. Step-tidy in
 * the same Phase 8 effort.
 */

import { useSeoMeta } from "@unhead/react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { AppShell } from "@/components/safesale/AppShell";
import { Avatar } from "@/components/safesale/Avatar";
import { EscrowStatusPill } from "@/components/safesale/EscrowStatus";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Filter, PackageCheck, Search } from "lucide-react";

import { useCurrentSeller } from "@/hooks/useCurrentSeller";
import { useSellerOrders } from "@/hooks/useSellerOrders";
import type { ApiListingImage, ApiOrderStatus, SellerOrderRow } from "@/lib/api";
import { formatNGN, formatRelative } from "@/lib/format";
import { cn, sanitizeUrl } from "@/lib/utils";

type FilterKey = "all" | "active" | "shipped" | "completed" | "disputed";

interface FilterSpec {
  key: FilterKey;
  label: string;
  matches: (s: ApiOrderStatus) => boolean;
}

const FILTERS: FilterSpec[] = [
  { key: "all", label: "All", matches: () => true },
  {
    key: "active",
    label: "Needs action",
    matches: (s) => s === "pending_payment" || s === "payment_locked",
  },
  {
    key: "shipped",
    label: "Shipped",
    matches: (s) => s === "shipped" || s === "delivered",
  },
  { key: "completed", label: "Completed", matches: (s) => s === "completed" },
  { key: "disputed", label: "Disputes", matches: (s) => s === "disputed" },
];

export default function OrdersPage() {
  useSeoMeta({ title: "Orders — SafeSale" });

  const [seller] = useCurrentSeller();
  const { orders, isLoading } = useSellerOrders();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter) ?? FILTERS[0];
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (!f.matches(o.status)) return false;
      if (!q) return true;
      return (
        o.shortId.toLowerCase().includes(q) ||
        o.buyerName.toLowerCase().includes(q) ||
        o.listing.title.toLowerCase().includes(q)
      );
    });
  }, [orders, filter, query]);

  const subtitle = isLoading
    ? "Loading…"
    : orders.length === 1
      ? "1 order so far"
      : `${orders.length} orders so far`;

  return (
    <AppShell title="Orders" subtitle={subtitle}>
      <div className="space-y-4">
        {/* Search + filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order ID, buyer name, or item"
              className="h-11 pl-9"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => {
              const count = orders.filter((o) => f.matches(o.status)).length;
              const isActive = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    isActive
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border bg-white text-ink-soft hover:text-ink",
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      isActive
                        ? "bg-white/15 text-white"
                        : "bg-secondary text-ink-soft",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              aria-label="More filters"
              className="ml-auto hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-ink-soft hover:text-ink lg:inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Filter className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {isLoading ? (
          <ListSkeleton />
        ) : !seller ? (
          <NotSignedUpEmpty />
        ) : orders.length === 0 ? (
          <NeverHadAnOrderEmpty />
        ) : filtered.length === 0 ? (
          <FilteredEmpty filter={filter} query={query} />
        ) : (
          <ul className="space-y-3">
            {filtered.map((o) => (
              <OrderRow key={o.orderToken} order={o} />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

/* -------------------------------- rows -------------------------------- */

function OrderRow({ order }: { order: SellerOrderRow }) {
  return (
    <li>
      <Link
        to={`/app/orders/${order.orderToken}`}
        className="block overflow-hidden rounded-2xl border border-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-16px_rgba(15,42,30,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <div className="flex items-start gap-3">
          <ListingThumb image={order.listing.images[0]} alt={order.listing.title} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {order.listing.title}
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {order.shortId} · {formatRelative(order.createdAt)}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft" />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Avatar
                  seed={order.buyerName}
                  name={order.buyerName}
                  size={22}
                />
                <span className="truncate text-xs text-ink-soft">
                  {order.buyerName} · {order.buyerCity}
                </span>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                {formatNGN(order.amountNGN)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <EscrowStatusPill status={order.status} size="sm" />
          <div className="flex items-center gap-2 text-[11px] text-ink-soft">
            {order.trackingNumber && (
              <span className="rounded-md bg-secondary px-2 py-0.5">
                {(order.carrier ?? "Carrier")} · {order.trackingNumber}
              </span>
            )}
            {order.status === "payment_locked" && (
              <span className="rounded-md bg-brand-soft px-2 py-0.5 text-brand-soft-foreground">
                Ready to ship
              </span>
            )}
            {order.status === "delivered" && (
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-700">
                Awaiting buyer confirm
              </span>
            )}
            {order.status === "disputed" && (
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-amber-800">
                Needs response
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}

/* ------------------------------ thumbnails ---------------------------- */

/**
 * The shared `ProductImage` only renders gradient placeholders from
 * seeds. Backend listings carry Blossom URLs, so we mirror the same
 * tiny URL-or-gradient contract used elsewhere (BuyerOrder.tsx,
 * OrderDetailPage.tsx). Cloned again; collapse into a shared component
 * in the refactor pass once #3 and #4 are done.
 */
function ListingThumb({
  image,
  alt,
}: {
  image: ApiListingImage | undefined;
  alt: string;
}) {
  const url = image?.url ? sanitizeUrl(image.url) : undefined;
  if (url) {
    return (
      <img
        src={url}
        alt={alt}
        loading="lazy"
        className="h-16 w-16 shrink-0 rounded-xl object-cover"
      />
    );
  }
  const seed = image?.seed ?? alt;
  return (
    <div
      aria-hidden
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-ink-soft"
      style={{
        background: `linear-gradient(135deg, hsl(${(hash(seed) % 360 + 360) % 360} 35% 88%), hsl(${(hash(seed) * 7 % 360 + 360) % 360} 30% 80%))`,
      }}
    >
      <PackageCheck className="h-6 w-6 opacity-50" />
    </div>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

/* ------------------------- skeleton + empties ------------------------- */

function ListSkeleton() {
  return (
    <ul className="space-y-3">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="overflow-hidden rounded-2xl border border-border bg-white p-4"
        >
          <div className="flex gap-3">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function NotSignedUpEmpty() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
      <p className="text-sm font-medium text-ink">Sign up to see orders</p>
      <p className="mx-auto mt-1 max-w-xs text-xs text-ink-soft">
        Open your SafeSale shop first — orders appear here once buyers start
        paying.
      </p>
    </div>
  );
}

function NeverHadAnOrderEmpty() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
      <p className="text-sm font-medium text-ink">No orders yet</p>
      <p className="mx-auto mt-1 max-w-xs text-xs text-ink-soft">
        Share your shop link to get your first sale. Every order will show up
        here in real time.
      </p>
    </div>
  );
}

function FilteredEmpty({
  filter,
  query,
}: {
  filter: FilterKey;
  query: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
      <p className="text-sm font-medium text-ink">No orders match</p>
      <p className="mx-auto mt-1 max-w-xs text-xs text-ink-soft">
        {query
          ? `Nothing matches "${query}". Try clearing the search.`
          : filter === "all"
            ? "You have no orders in any filter."
            : "Try a different filter or check back later."}
      </p>
    </div>
  );
}
