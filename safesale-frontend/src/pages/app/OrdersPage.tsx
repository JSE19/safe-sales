import { useSeoMeta } from "@unhead/react";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/safesale/AppShell";
import { ProductImage } from "@/components/safesale/ProductImage";
import { EscrowStatusPill } from "@/components/safesale/EscrowStatus";
import { Avatar } from "@/components/safesale/Avatar";
import { orders, listings } from "@/lib/mock";
import { formatNGN, formatRelative } from "@/lib/format";
import { ChevronRight, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { EscrowStatus } from "@/lib/types";

type FilterKey = "all" | "active" | "shipped" | "completed" | "disputed";

const FILTERS: { key: FilterKey; label: string; matches: (s: EscrowStatus) => boolean }[] = [
  { key: "all", label: "All", matches: () => true },
  {
    key: "active",
    label: "Needs action",
    matches: (s) => s === "pending_payment" || s === "payment_locked",
  },
  { key: "shipped", label: "Shipped", matches: (s) => s === "shipped" || s === "delivered" },
  { key: "completed", label: "Completed", matches: (s) => s === "completed" },
  { key: "disputed", label: "Disputes", matches: (s) => s === "disputed" },
];

export default function OrdersPage() {
  useSeoMeta({ title: "Orders — SafeSale" });
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter)!;
    return orders.filter((o) => {
      if (!f.matches(o.status)) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        o.shortId.toLowerCase().includes(q) ||
        o.buyerName.toLowerCase().includes(q)
      );
    });
  }, [filter, query]);

  return (
    <AppShell
      title="Orders"
      subtitle={`${orders.length} orders this month`}
    >
      <div className="space-y-4">
        {/* Search + filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by order ID or buyer name"
              className="h-11 pl-9"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scroll-thin">
            {FILTERS.map((f) => {
              const count = orders.filter((o) => f.matches(o.status)).length;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    filter === f.key
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border bg-white text-ink-soft hover:text-ink"
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                      filter === f.key
                        ? "bg-white/15 text-white"
                        : "bg-secondary text-ink-soft"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
            <button className="ml-auto hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-ink-soft hover:text-ink lg:inline-flex">
              <Filter className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Order list */}
        {filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="space-y-3">
            {filtered.map((o) => {
              const listing = listings.find((l) => l.id === o.listingId);
              return (
                <li key={o.id}>
                  <Link
                    to={`/app/orders/${o.shortId}`}
                    className="block overflow-hidden rounded-2xl border border-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-16px_rgba(15,42,30,0.18)]"
                  >
                    <div className="flex items-start gap-3">
                      {listing && (
                        <ProductImage
                          image={listing.images[0]}
                          className="h-16 w-16 shrink-0"
                          rounded="rounded-xl"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink">
                              {listing?.title ?? "Order"}
                            </p>
                            <p className="mt-0.5 text-xs text-ink-soft">
                              {o.shortId} · {formatRelative(o.createdAt)}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft" />
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar seed={o.buyerName} name={o.buyerName} size={22} />
                            <span className="truncate text-xs text-ink-soft">
                              {o.buyerName} · {o.buyerCity}
                            </span>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-ink tabular-nums">
                            {formatNGN(o.amountNGN)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                      <EscrowStatusPill status={o.status} size="sm" />
                      <div className="flex items-center gap-2 text-[11px] text-ink-soft">
                        {o.trackingNumber && (
                          <span className="rounded-md bg-secondary px-2 py-0.5">
                            {o.carrier} · {o.trackingNumber}
                          </span>
                        )}
                        {o.status === "payment_locked" && (
                          <span className="rounded-md bg-brand-soft px-2 py-0.5 text-brand-soft-foreground">
                            Ready to ship
                          </span>
                        )}
                        {o.status === "delivered" && (
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-indigo-700">
                            Awaiting buyer confirm
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
      <p className="text-sm font-medium text-ink">No orders match this filter</p>
      <p className="mx-auto mt-1 max-w-xs text-xs text-ink-soft">
        Try a different filter or share your shop link to get more orders.
      </p>
    </div>
  );
}
