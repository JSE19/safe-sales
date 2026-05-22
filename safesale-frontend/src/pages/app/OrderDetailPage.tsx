/**
 * Seller Order Detail — `/app/orders/:token`
 *
 * Mirrors the buyer-side page (`/order/:token`) but from the seller's
 * angle. Data shape and wiring pattern are deliberately the same:
 *
 *   - `apiClient.getOrder(token)` → polled every 8s while non-terminal
 *   - `apiClient.shipOrder(token, { trackingNumber, carrier })` →
 *     mutation behind the "Mark as shipped" dialog
 *
 * The page renders straight off `ApiOrder` + `ApiListing` + `ApiSeller`.
 * The earlier version of this file ran off `src/lib/mock.ts` fixtures
 * and surfaced dispute-resolution + return-flow + review cards built
 * for the demo screenshots. Those will come back when the real
 * dispute/review APIs are wired (kinds 33889 + 1985 from NIP.md);
 * removing them here keeps this commit honest about what's real.
 *
 * URL parameter is `:token` (not `:id` or `:shortId`) because that's
 * the only identifier the backend accepts on the order endpoints. The
 * OrdersPage link was updated in the same commit.
 */

import { useSeoMeta } from "@unhead/react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AppShell } from "@/components/safesale/AppShell";
import { Avatar } from "@/components/safesale/Avatar";
import { EscrowShield } from "@/components/safesale/EscrowShield";
import { EscrowStatusPill } from "@/components/safesale/EscrowStatus";
import { Timeline, type TimelineStep } from "@/components/safesale/Timeline";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Copy,
  Loader2,
  PackageCheck,
  Phone,
  Truck,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import {
  apiClient,
  ApiError,
  type ApiListingImage,
  type ApiOrder,
  type ApiOrderStatus,
  type GetOrderResponse,
} from "@/lib/api";
import { formatDate, formatNGN, formatRelative, formatTime } from "@/lib/format";
import { sanitizeUrl } from "@/lib/utils";

/** Backend order statuses that won't change — stop polling here. */
const TERMINAL_STATUSES: ApiOrderStatus[] = ["completed", "refunded"];

const CARRIERS = ["GIG Logistics", "DHL", "Other"] as const;
type Carrier = (typeof CARRIERS)[number];

export default function OrderDetailPage() {
  useSeoMeta({ title: "Order detail — SafeSale" });

  const { token = "" } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  /* ------------------------------- data ------------------------------- */

  const query = useQuery<GetOrderResponse>({
    queryKey: ["safesale", "order", token],
    enabled: token.length > 0,
    queryFn: () => apiClient.getOrder(token),
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data) return 8_000;
      return TERMINAL_STATUSES.includes(data.order.status) ? false : 8_000;
    },
    retry: (failureCount, err) => {
      if (err instanceof ApiError && err.code === "ORDER_NOT_FOUND") return false;
      return failureCount < 2;
    },
  });

  /* ----------------------------- ui state ---------------------------- */

  const [shipOpen, setShipOpen] = useState(false);
  const [tracking, setTracking] = useState("");
  const [carrier, setCarrier] = useState<Carrier>("GIG Logistics");

  /* ----------------------------- mutations --------------------------- */

  const shipMutation = useMutation({
    mutationFn: () =>
      apiClient.shipOrder(token, {
        trackingNumber: tracking.trim() || undefined,
        carrier,
      }),
    onSuccess: (res) => {
      qc.setQueryData<GetOrderResponse>(
        ["safesale", "order", token],
        (prev) => (prev ? { ...prev, order: res.order } : prev),
      );
      // Refresh the dashboard order feed so the "Needs your attention"
      // list drops this row immediately.
      qc.invalidateQueries({ queryKey: ["safesale", "seller-orders"] });
      setShipOpen(false);
      setTracking("");
      toast({
        title: "Marked as shipped",
        description: "Buyer was notified.",
      });
    },
    onError: (err: unknown) => {
      toast({
        title: "Couldn't mark as shipped",
        description:
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Try again in a moment.",
        variant: "destructive",
      });
    },
  });

  /* ----------------------------- guards ----------------------------- */

  if (query.isLoading) {
    return (
      <AppShell title="Order detail">
        <OrderSkeleton />
      </AppShell>
    );
  }

  if (query.isError || !query.data) {
    const notFound =
      query.error instanceof ApiError &&
      query.error.code === "ORDER_NOT_FOUND";
    return (
      <AppShell title="Order not found">
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink">
            {notFound
              ? "We couldn't find that order."
              : "Something went wrong loading this order."}
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/app/orders">Back to orders</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const { order, listing } = query.data;

  return (
    <AppShell
      title={`Order ${order.shortId}`}
      subtitle={`Placed ${formatRelative(order.createdAt)}`}
    >
      <div className="space-y-5">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
        </button>

        {/* Hero card — product + amount + status */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_-16px_rgba(15,42,30,0.12)]">
          <div className="flex items-start gap-4">
            <ListingThumb image={listing.images[0]} alt={listing.title} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-ink">
                {listing.title}
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">
                {order.variant ?? ""}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-2xl font-semibold tracking-tight text-ink">
                  {formatNGN(order.amountNGN)}
                </p>
                <span className="text-[11px] text-ink-soft">
                  ≈ {order.amountSats.toLocaleString()} sats
                </span>
              </div>
              <EscrowStatusPill status={order.status} className="mt-3" />
            </div>
          </div>
        </div>

        {listing.description && (
          <section className="rounded-2xl border border-border bg-white p-5">
            <h2 className="text-sm font-semibold text-ink">
              Product description
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
              {listing.description}
            </p>
          </section>
        )}

        {/* Escrow shield — payment locked but not shipped */}
        {order.status === "payment_locked" && (
          <EscrowShield
            amount={formatNGN(order.amountNGN)}
            caption="Funds are secured. Ship the order to release payment after delivery."
          />
        )}

        {/* Primary action — ship */}
        {order.status === "payment_locked" && (
          <Button
            onClick={() => setShipOpen(true)}
            size="lg"
            className="h-12 w-full rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
          >
            <Truck className="mr-2 h-4 w-4" /> Mark as shipped
          </Button>
        )}

        {/* In-transit confirmation */}
        {order.status === "shipped" && (
          <div className="rounded-2xl border border-sky-200/70 bg-sky-50/60 p-4">
            <div className="flex items-start gap-3">
              <Truck className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
              <div>
                <p className="text-sm font-medium text-sky-900">In transit</p>
                <p className="mt-0.5 text-xs text-sky-800/80">
                  {[
                    order.carrier ?? "Carrier not specified",
                    order.trackingNumber ?? "No tracking number",
                    order.shippedAt
                      ? `shipped ${formatRelative(order.shippedAt)}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
          </div>
        )}

        {order.status === "delivered" && (
          <div className="rounded-2xl border border-indigo-200/70 bg-indigo-50/60 p-4">
            <p className="text-sm font-medium text-indigo-900">
              Delivered — waiting for buyer confirmation
            </p>
            {order.autoReleaseAt && (
              <p className="mt-1 text-xs text-indigo-800/80">
                Auto-releases on {formatDate(order.autoReleaseAt)}.
              </p>
            )}
          </div>
        )}

        {order.status === "disputed" && (
          <Link
            to="/app/dispute"
            className="flex items-center justify-between rounded-2xl border border-rose-200/70 bg-rose-50/60 p-4 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div>
                <p className="text-sm font-medium text-rose-900">
                  Dispute open
                </p>
                <p className="mt-0.5 text-xs text-rose-800/80">
                  {order.notes ?? "Buyer has opened a dispute on this order."}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-rose-700" />
          </Link>
        )}

        {order.status === "completed" && (
          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-4">
            <p className="text-sm font-medium text-emerald-900">
              Payment released
            </p>
            {order.releasedAt && (
              <p className="mt-1 text-xs text-emerald-800/80">
                Released {formatRelative(order.releasedAt)} · sats settled.
              </p>
            )}
          </div>
        )}

        {/* Buyer + timeline */}
        <div className="grid gap-5 lg:grid-cols-3">
          <Section title="Buyer" className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <Avatar
                seed={order.buyerName}
                name={order.buyerName}
                size={42}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {order.buyerName}
                </p>
                <p className="truncate text-xs text-ink-soft">
                  {order.buyerCity}
                </p>
              </div>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <CopyRow
                icon={Phone}
                label={order.buyerPhone}
                onCopy={() =>
                  navigator.clipboard
                    ?.writeText(order.buyerPhone)
                    .then(() => toast({ title: "Phone copied" }))
                }
              />
            </div>
          </Section>

          <Section title="Timeline" className="lg:col-span-2">
            <Timeline steps={timelineFor(order)} />
          </Section>
        </div>

        <Section title="Payment details">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <Row k="Item price" v={formatNGN(order.amountNGN)} />
            <Row k="Order ID" v={order.shortId} />
            {order.autoReleaseAt && (
              <Row
                k="Auto-release on"
                v={formatDate(order.autoReleaseAt)}
              />
            )}
            <Row k="Placed" v={formatDate(order.createdAt)} />
            {order.shippedAt && (
              <Row k="Shipped" v={formatDate(order.shippedAt)} />
            )}
            {order.releasedAt && (
              <Row k="Released" v={formatDate(order.releasedAt)} />
            )}
          </dl>
        </Section>
      </div>

      {/* Ship dialog — wires to POST /api/orders/:token/ship */}
      <Dialog open={shipOpen} onOpenChange={setShipOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark order as shipped</DialogTitle>
            <DialogDescription>
              Add a tracking number so the buyer knows it's on the way. Both
              fields are optional — confirm shipping even if you don't have a
              tracking number yet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Carrier</Label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {CARRIERS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCarrier(c)}
                    className={
                      "rounded-md border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand " +
                      (carrier === c
                        ? "border-brand bg-brand-soft text-brand-soft-foreground"
                        : "border-border bg-white text-ink-soft hover:text-ink")
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="tracking">Tracking number</Label>
              <Input
                id="tracking"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="GIG-12345"
                className="mt-1.5 h-11"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShipOpen(false)}
              disabled={shipMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => shipMutation.mutate()}
              disabled={shipMutation.isPending}
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {shipMutation.isPending ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Confirming…
                </>
              ) : (
                <>
                  <Truck className="mr-1 h-4 w-4" /> Confirm shipped
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

/* -------------------------- small subcomponents ------------------------ */

function Section({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        "rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_-16px_rgba(15,42,30,0.12)] " +
        (className ?? "")
      }
    >
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 pb-2 last:border-0 sm:border-0 sm:pb-0">
      <dt className="text-xs text-ink-soft">{k}</dt>
      <dd className="text-sm font-medium tabular-nums text-ink">{v}</dd>
    </div>
  );
}

function CopyRow({
  icon: Icon,
  label,
  onCopy,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-surface/40 px-3 py-2">
      <Icon className="h-3.5 w-3.5 text-ink-soft" />
      <span className="flex-1 truncate text-ink">{label}</span>
      <button
        onClick={onCopy}
        className="text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
        aria-label="Copy"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function OrderSkeleton() {  return (
    <div className="space-y-5">
      <Skeleton className="h-3 w-24" />
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="flex gap-4">
          <Skeleton className="h-20 w-20 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-32 rounded-2xl lg:col-span-1" />
        <Skeleton className="h-32 rounded-2xl lg:col-span-2" />
      </div>
    </div>
  );
}

/* ----------------------------- listing thumb -------------------------- */

/**
 * The shared `ProductImage` component only renders seed-based gradient
 * placeholders. Backend listings carry real Blossom URLs, so we
 * recreate the same small contract here: render the URL when present,
 * fall back to a deterministic gradient for seed-only fixtures.
 *
 * Cloned from `BuyerOrder.tsx::ListingThumb`. When/if these consolidate
 * into a single reusable component, drop both copies.
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
        className="h-20 w-20 shrink-0 rounded-xl object-cover"
      />
    );
  }
  const seed = image?.seed ?? alt;
  return (
    <div
      aria-hidden
      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl text-ink-soft"
      style={{
        background: `linear-gradient(135deg, hsl(${(hashCode(seed) % 360 + 360) % 360} 35% 88%), hsl(${(hashCode(seed) * 7 % 360 + 360) % 360} 30% 80%))`,
      }}
    >
      <PackageCheck className="h-7 w-7 opacity-50" />
    </div>
  );
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h;
}

/* ------------------------------- timeline ----------------------------- */
function timelineFor(o: ApiOrder): TimelineStep[] {
  type StepState = TimelineStep["state"];
  const get = (
    states: Partial<Record<ApiOrderStatus, StepState>>,
    fallback: StepState,
  ): StepState => states[o.status] ?? fallback;

  return [
    {
      key: "placed",
      title: "Order placed",
      at: formatTime(o.createdAt),
      description: `${o.buyerName} from ${o.buyerCity}`,
      state: "done",
    },
    {
      key: "paid",
      title: "Payment secured in escrow",
      description:
        o.status === "pending_payment"
          ? "Awaiting bank transfer"
          : formatNGN(o.amountNGN),
      at:
        o.status === "pending_payment" ? undefined : formatTime(o.updatedAt),
      state: get({ pending_payment: "active" }, "done"),
    },
    {
      key: "shipped",
      title: "Shipped with tracking",
      description: o.trackingNumber
        ? `${o.carrier ?? "Carrier"} · ${o.trackingNumber}`
        : "Add tracking when you ship",
      at: o.shippedAt ? formatTime(o.shippedAt) : undefined,
      state: get(
        {
          pending_payment: "pending",
          payment_locked: "active",
        },
        "done",
      ),
    },
    {
      key: "delivered",
      title: "Delivered",
      // Backend doesn't expose a deliveredAt field separately yet; use
      // shippedAt as a proxy hint that we're past the shipped step.
      at: undefined,
      state: get(
        {
          pending_payment: "pending",
          payment_locked: "pending",
          shipped: "active",
        },
        o.status === "disputed" ? "alert" : "done",
      ),
    },
    {
      key: "released",
      title: o.status === "disputed" ? "Dispute under review" : "Payment released",
      at: o.releasedAt ? formatTime(o.releasedAt) : undefined,
      description:
        o.status === "completed"
          ? `${formatNGN(o.amountNGN)} settled in sats`
          : o.status === "disputed"
            ? "SafeSale mediator reviewing evidence"
            : undefined,
      state:
        o.status === "completed"
          ? "done"
          : o.status === "disputed"
            ? "alert"
            : o.status === "delivered"
              ? "active"
              : "pending",
    },
  ];
}
