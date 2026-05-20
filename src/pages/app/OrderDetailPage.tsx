import { useSeoMeta } from "@unhead/react";
import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/safesale/AppShell";
import { ProductImage } from "@/components/safesale/ProductImage";
import { EscrowStatusPill } from "@/components/safesale/EscrowStatus";
import { EscrowShield } from "@/components/safesale/EscrowShield";
import { Avatar } from "@/components/safesale/Avatar";
import { Timeline, type TimelineStep } from "@/components/safesale/Timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getOrder, getListing, getDisputeForOrder } from "@/lib/mock";
import { DisputeResolutionCard } from "@/components/safesale/DisputeResolution";
import { ReturnFlow } from "@/components/safesale/ReturnFlow";
import { ReviewPrompt } from "@/components/safesale/ReviewPrompt";
import { formatDate, formatNGN, formatRelative, formatTime } from "@/lib/format";
import {
  ArrowLeft,
  Truck,
  MessageCircle,
  Copy,
  Phone,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import type { Order } from "@/lib/types";

export default function OrderDetailPage() {
  useSeoMeta({ title: "Order detail — SafeSale" });
  const { id = "" } = useParams<{ id: string }>();
  const order = getOrder(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shipOpen, setShipOpen] = useState(false);
  const [tracking, setTracking] = useState(order?.trackingNumber ?? "");
  const [carrier, setCarrier] = useState(order?.carrier ?? "GIG Logistics");

  if (!order) {
    return (
      <AppShell title="Order not found">
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink">We couldn't find that order.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/app/orders">Back to orders</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const listing = getListing(order.listingId);

  return (
    <AppShell
      title={`Order ${order.shortId}`}
      subtitle={`Placed ${formatRelative(order.createdAt)}`}
    >
      <div className="space-y-5">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to orders
        </button>

        {/* Hero state card */}
        <div
          className="overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_-16px_rgba(15,42,30,0.12)]"
        >
          <div className="flex items-start gap-4">
            {listing && (
              <ProductImage
                image={listing.images[0]}
                className="h-20 w-20 shrink-0"
                rounded="rounded-xl"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-ink">
                {listing?.title}
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">{order.variant ?? ""}</p>
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

        {/* Resolved dispute outcome (shown when this order's dispute is resolved) */}
        {listing?.description && (
            <section className="rounded-2xl border border-border bg-white p-5">
              <h2 className="text-sm font-semibold text-ink">Product description</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {listing.description}
              </p>
            </section>
          )}

          {(() => {
          const dispute = getDisputeForOrder(order.id);
          if (dispute?.status === "resolved" && dispute.resolution) {
            return (
              <DisputeResolutionCard resolution={dispute.resolution} viewer="seller" />
            );
          }
          if (dispute?.isReturn && dispute.status !== "resolved") {
            return <ReturnFlow evidence={dispute.returnEvidence} viewer="seller" />;
          }
          return null;
        })()}

        {/* Escrow shield - only when payment locked */}
        {order.status === "payment_locked" && (
          <EscrowShield
            amount={formatNGN(order.amountNGN)}
            caption="Funds are secured. Ship the order to release payment after delivery."
          />
        )}

        {/* Primary actions */}
        {order.status === "payment_locked" && (
          <Button
            onClick={() => setShipOpen(true)}
            size="lg"
            className="h-12 w-full rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
          >
            <Truck className="mr-2 h-4 w-4" /> Mark as shipped
          </Button>
        )}
        {order.status === "shipped" && (
          <div className="rounded-2xl border border-sky-200/70 bg-sky-50/60 p-4">
            <div className="flex items-start gap-3">
              <Truck className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
              <div>
                <p className="text-sm font-medium text-sky-900">In transit</p>
                <p className="mt-0.5 text-xs text-sky-800/80">
                  {order.carrier} · {order.trackingNumber} · shipped{" "}
                  {formatRelative(order.shippedAt!)}
                </p>
              </div>
            </div>
          </div>
        )}
        {order.status === "delivered" && (
          <div className="rounded-2xl border border-indigo-200/70 bg-indigo-50/60 p-4">
            <p className="text-sm font-medium text-indigo-900">
              Delivered — buyer has 3 days to confirm
            </p>
            <p className="mt-1 text-xs text-indigo-800/80">
              Auto-releases on{" "}
              {formatDate(
                new Date(
                  new Date(order.deliveredAt!).getTime() + 3 * 86400000
                ).toISOString()
              )}
              .
            </p>
          </div>
        )}
        {order.status === "disputed" && (
          <Link
            to="/app/dispute"
            className="flex items-center justify-between rounded-2xl border border-rose-200/70 bg-rose-50/60 p-4 hover:bg-rose-50"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div>
                <p className="text-sm font-medium text-rose-900">
                  Dispute open
                </p>
                <p className="mt-0.5 text-xs text-rose-800/80">
                  {order.notes ?? "Awaiting evidence from both sides."}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-rose-700" />
          </Link>
        )}

        {/* Review prompt — appears once the order is completed */}
        {order.status === "completed" && (
          <ReviewPrompt
            viewer="seller"
            counterpartyName={order.buyerName}
            counterpartyAvatarSeed={order.buyerName}
            productLabel={`${order.shortId} · ${formatNGN(order.amountNGN)}`}
          />
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Buyer + Timeline */}
          <Section title="Buyer" className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <Avatar seed={order.buyerName} name={order.buyerName} size={42} />
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
              <CopyRow icon={Phone} label={order.buyerPhone} onCopy={() =>
                navigator.clipboard?.writeText(order.buyerPhone).then(() =>
                  toast({ title: "Phone copied" })
                )
              } />
            </div>
            <div className="mt-3 flex gap-2">
              <Button asChild variant="outline" size="sm" className="h-8 flex-1">
                <Link to="/app/chat">
                  <MessageCircle className="mr-1 h-3.5 w-3.5" /> Message
                </Link>
              </Button>
            </div>
          </Section>

          <Section title="Timeline" className="lg:col-span-2">
            <Timeline steps={timelineFor(order)} />
          </Section>
        </div>

        {/* Payment + protection details */}
        <Section title="Payment details">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <Row k="Item price" v={formatNGN(order.amountNGN)} />
            <Row k="Order ID" v={order.shortId} />
            <Row
              k="Buyer protection until"
              v={formatDate(order.protectedUntil)}
            />
            <Row k="Placed" v={formatDate(order.createdAt)} />
            {order.shippedAt && <Row k="Shipped" v={formatDate(order.shippedAt)} />}
            {order.deliveredAt && (
              <Row k="Delivered" v={formatDate(order.deliveredAt)} />
            )}
          </dl>
        </Section>
      </div>

      {/* Ship dialog */}
      <Dialog open={shipOpen} onOpenChange={setShipOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark order as shipped</DialogTitle>
            <DialogDescription>
              Add a tracking number so the buyer knows it's on the way.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Carrier</Label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {["GIG Logistics", "DHL", "Other"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCarrier(c)}
                    className={
                      "rounded-md border px-3 py-2 text-xs font-medium transition-colors " +
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
            <Button variant="outline" onClick={() => setShipOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Marked as shipped",
                  description: "Buyer was notified.",
                });
                setShipOpen(false);
              }}
              disabled={!tracking}
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              <Truck className="mr-1 h-4 w-4" /> Confirm shipped
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

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
    <div className="flex items-center gap-2 rounded-md border border-border bg-surface-2/40 px-3 py-2">
      <Icon className="h-3.5 w-3.5 text-ink-soft" />
      <span className="flex-1 truncate text-ink">{label}</span>
      <button onClick={onCopy} className="text-brand hover:underline">
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function timelineFor(o: Order): TimelineStep[] {
  type StepState = TimelineStep["state"];
  const get = (states: { [k in typeof o.status]?: StepState }, fallback: StepState): StepState =>
    states[o.status] ?? fallback;

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
      description: o.status === "pending_payment" ? "Awaiting bank transfer" : formatNGN(o.amountNGN),
      at: o.status === "pending_payment" ? undefined : formatTime(o.updatedAt),
      state: get(
        { pending_payment: "active" },
        "done"
      ),
    },
    {
      key: "shipped",
      title: "Shipped with tracking",
      description: o.trackingNumber
        ? `${o.carrier} · ${o.trackingNumber}`
        : "Add tracking when you ship",
      at: o.shippedAt ? formatTime(o.shippedAt) : undefined,
      state: get(
        {
          pending_payment: "pending",
          payment_locked: "active",
        },
        "done"
      ),
    },
    {
      key: "delivered",
      title: "Delivered",
      at: o.deliveredAt ? formatTime(o.deliveredAt) : undefined,
      state: get(
        {
          pending_payment: "pending",
          payment_locked: "pending",
          shipped: "active",
        },
        o.status === "disputed" ? "alert" : "done"
      ),
    },
    {
      key: "released",
      title: o.status === "disputed" ? "Dispute under review" : "Payment released",
      at: o.status === "completed" ? formatTime(o.updatedAt) : undefined,
      description:
        o.status === "completed"
          ? `${formatNGN(o.amountNGN)} sent to your bank`
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


