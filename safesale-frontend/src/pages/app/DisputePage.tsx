import { useSeoMeta } from "@unhead/react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "@/components/safesale/AppShell";
import { Avatar } from "@/components/safesale/Avatar";
import { ProductImage } from "@/components/safesale/ProductImage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Timeline, type TimelineStep } from "@/components/safesale/Timeline";
import { Countdown } from "@/components/safesale/Countdown";
import { DisputeResolutionCard } from "@/components/safesale/DisputeResolution";
import { ReturnFlow } from "@/components/safesale/ReturnFlow";
import {
  disputes,
  chat,
  getOrder,
  getListing,
  currentSeller,
} from "@/lib/mock";
import { formatNGN, formatRelative, formatTime } from "@/lib/format";
import {
  ImagePlus,
  Scale,
  ShieldCheck,
  MessageCircle,
  Upload,
  ArrowLeft,
  ChevronRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Dispute, DisputeStatus } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*                                  ROUTE                                     */
/* -------------------------------------------------------------------------- */

export default function DisputePage() {
  const { id } = useParams<{ id?: string }>();

  // List view if no dispute id supplied.
  if (!id) return <DisputeList />;

  const dispute = disputes.find((d) => d.id === id);
  if (!dispute) {
    return (
      <AppShell title="Dispute not found">
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink">
            We couldn't find that dispute.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/app/dispute">Back to all disputes</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return <DisputeDetailView dispute={dispute} />;
}

/* -------------------------------------------------------------------------- */
/*                                  LIST                                      */
/* -------------------------------------------------------------------------- */

function DisputeList() {
  useSeoMeta({ title: "Disputes — SafeSale" });
  const sellerDisputes = disputes.filter((d) => {
    const o = getOrder(d.orderId);
    return o?.sellerId === currentSeller.id;
  });
  const open = sellerDisputes.filter((d) => d.status !== "resolved");
  const closed = sellerDisputes.filter((d) => d.status === "resolved");

  return (
    <AppShell
      title="Disputes"
      subtitle="Stay calm. Share evidence. We'll get to a fair outcome."
    >
      <div className="space-y-5">
        {open.length === 0 ? (
          <EmptyDisputes />
        ) : (
          <Section title="Needs your action" count={open.length}>
            <ul className="space-y-3">
              {open.map((d) => <DisputeRow key={d.id} dispute={d} />)}
            </ul>
          </Section>
        )}

        {closed.length > 0 && (
          <Section title="Resolved" count={closed.length}>
            <ul className="space-y-3">
              {closed.map((d) => <DisputeRow key={d.id} dispute={d} />)}
            </ul>
          </Section>
        )}
      </div>
    </AppShell>
  );
}

function EmptyDisputes() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
      <ShieldCheck className="mx-auto h-7 w-7 text-brand" />
      <p className="mt-3 text-sm font-medium text-ink">No active disputes</p>
      <p className="mt-1 text-xs text-ink-soft">
        99.4% of your orders complete without a dispute. Keep it up.
      </p>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <span className="text-[11px] text-ink-soft">{count}</span>
      </div>
      {children}
    </section>
  );
}

function DisputeRow({ dispute }: { dispute: Dispute }) {
  const order = getOrder(dispute.orderId);
  const listing = order ? getListing(order.listingId) : undefined;
  return (
    <li>
      <Link
        to={`/app/dispute/${dispute.id}`}
        className="block rounded-2xl border border-border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-16px_rgba(15,42,30,0.18)]"
      >
        <div className="flex items-start gap-3">
          {listing && (
            <ProductImage
              image={listing.images[0]}
              className="h-14 w-14 shrink-0"
              rounded="rounded-lg"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {dispute.reason}
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {order?.shortId} · {listing?.title} · {formatNGN(dispute.amountNGN)}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <DisputeStatusBadge status={dispute.status} />
              {dispute.directResolutionUntil && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                  <Clock className="h-2.5 w-2.5" />
                  <Countdown targetIso={dispute.directResolutionUntil} prefix="Direct window" />
                </span>
              )}
              {dispute.evidenceDueAt && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-800 ring-1 ring-inset ring-rose-200">
                  <AlertCircle className="h-2.5 w-2.5" />
                  <Countdown targetIso={dispute.evidenceDueAt} prefix="Evidence due in" />
                </span>
              )}
              {dispute.isReturn && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                  Return in progress
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 DETAIL                                     */
/* -------------------------------------------------------------------------- */

function DisputeDetailView({ dispute }: { dispute: Dispute }) {
  const order = getOrder(dispute.orderId);
  const listing = order ? getListing(order.listingId) : undefined;
  useSeoMeta({ title: `Dispute on ${order?.shortId ?? "order"} — SafeSale` });

  if (!order || !listing) {
    return (
      <AppShell title="Dispute not found">
        <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink">Order missing from this dispute.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/app/dispute">Back to disputes</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const isResolved = dispute.status === "resolved";

  return (
    <AppShell
      title={`Dispute on ${order.shortId}`}
      subtitle={
        isResolved
          ? "This case has been closed."
          : "Stay calm. Share clear evidence. A mediator will decide fairly."
      }
    >
      <div className="space-y-5">
        <Link
          to="/app/dispute"
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All disputes
        </Link>

        <StatusBanner dispute={dispute} />

        {/* Resolved cases show the outcome card and skip the response form. */}
        {isResolved && dispute.resolution && (
          <DisputeResolutionCard resolution={dispute.resolution} viewer="seller" />
        )}

        {/* Return flow widget when this is a return. */}
        {dispute.isReturn && (
          <ReturnFlow evidence={dispute.returnEvidence} viewer="seller" />
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Order context */}
          <section className="rounded-2xl border border-border bg-white p-4 lg:col-span-1">
            <h2 className="text-sm font-semibold text-ink">Order in dispute</h2>
            <div className="mt-3 flex items-start gap-3">
              <ProductImage image={listing.images[0]} className="h-14 w-14" rounded="rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-ink">
                  {listing.title}
                </p>
                <p className="text-xs text-ink-soft">
                  {order.shortId} · {formatNGN(order.amountNGN)}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <Card sub="Buyer">
                <Avatar seed={order.buyerName} name={order.buyerName} size={32} />
                <p className="mt-2 truncate text-xs font-medium text-ink">
                  {order.buyerName}
                </p>
              </Card>
              <Card sub="Seller">
                <Avatar
                  seed={currentSeller.avatarSeed}
                  name={currentSeller.name}
                  size={32}
                />
                <p className="mt-2 truncate text-xs font-medium text-ink">You</p>
              </Card>
            </div>
          </section>

          {/* Response form — only when the dispute is still actionable */}
          {!isResolved ? (
            <ResponseForm dispute={dispute} />
          ) : (
            <section className="rounded-2xl border border-border bg-white p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold text-ink">Your final response</h2>
              <p className="mt-2 text-sm text-ink-soft">
                This dispute is closed. The outcome above is final and audit-recorded.
              </p>
            </section>
          )}
        </div>

        {/* Timeline of events */}
        <section className="rounded-2xl border border-border bg-white p-5">
          <h2 className="text-sm font-semibold text-ink">What happened</h2>
          <Timeline
            className="mt-4"
            steps={buildTimeline(dispute, order, listing)}
          />
        </section>

        {/* Chat embed (preview of NIP-17 thread for this order) */}
        <section className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Order chat</h2>
            <span className="text-[11px] font-medium text-ink-soft">
              Most recent messages
            </span>
          </div>
          <ul className="mt-4 space-y-3">
            {chat.slice(-3).map((m) => (
              <ChatPreview key={m.id} m={m} />
            ))}
          </ul>
        </section>

        {/* Reassurance */}
        {!isResolved && (
          <div className="rounded-2xl border border-emerald-200/60 bg-brand-soft/40 p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <div className="text-sm text-ink-soft">
                <p className="text-sm font-medium text-ink">
                  You're not alone in this
                </p>
                <p className="mt-1 text-xs leading-relaxed">
                  Funds stay frozen while the case is open. A trained SafeSale
                  mediator reviews evidence from both sides and decides — usually
                  within 24 hours of escalation.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                          STATUS-AWARE BANNER                               */
/* -------------------------------------------------------------------------- */

function StatusBanner({ dispute }: { dispute: Dispute }) {
  const status = dispute.status;

  if (status === "direct_resolution") {
    return (
      <div className="overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-white p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <MessageCircle className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">
              Try to resolve directly with the buyer first
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              For the next 72 hours, you and the buyer can work this out via chat —
              a replacement, a partial refund, or a clear explanation. If you
              don't reach an agreement, a SafeSale mediator will automatically
              take the case.
            </p>
            {dispute.directResolutionUntil && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-900">
                <Clock className="h-3 w-3" />
                Auto-escalates in{" "}
                <Countdown targetIso={dispute.directResolutionUntil} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === "escalated" || status === "mediating") {
    return (
      <div className="overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-white p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Scale className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">
              Mediation in progress
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              {formatNGN(dispute.amountNGN)} is held safely while a SafeSale
              mediator reviews. Most cases are resolved within 24 hours.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "evidence_requested") {
    return (
      <div className="overflow-hidden rounded-2xl border border-rose-200/70 bg-gradient-to-br from-rose-50 to-white p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <AlertCircle className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">
              The mediator needs more evidence
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              Add the requested photos or messages below. Missing the deadline
              weakens your case.
            </p>
            {dispute.evidenceDueAt && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-medium text-rose-900">
                <Clock className="h-3 w-3" />
                Evidence due in <Countdown targetIso={dispute.evidenceDueAt} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // resolved — handled in parent as the DisputeResolutionCard.
  return null;
}

function DisputeStatusBadge({ status }: { status: DisputeStatus }) {
  const map: Record<DisputeStatus, { label: string; bg: string; text: string; ring: string }> = {
    direct_resolution: { label: "Direct resolution", bg: "bg-amber-50", text: "text-amber-800", ring: "ring-amber-200" },
    escalated: { label: "Escalated", bg: "bg-rose-50", text: "text-rose-800", ring: "ring-rose-200" },
    evidence_requested: { label: "Evidence requested", bg: "bg-rose-50", text: "text-rose-800", ring: "ring-rose-200" },
    mediating: { label: "Mediating", bg: "bg-amber-50", text: "text-amber-800", ring: "ring-amber-200" },
    resolved: { label: "Resolved", bg: "bg-brand-soft", text: "text-brand-soft-foreground", ring: "ring-emerald-200" },
  };
  const s = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
        s.bg,
        s.text,
        s.ring
      )}
    >
      {s.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*                              RESPONSE FORM                                 */
/* -------------------------------------------------------------------------- */

function ResponseForm({ dispute }: { dispute: Dispute }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 lg:col-span-2">
      <h2 className="text-sm font-semibold text-ink">Your response</h2>
      <p className="mt-1 text-xs text-ink-soft">Buyer says: "{dispute.summary}"</p>

      <div className="mt-4 space-y-4">
        <div>
          <Label>Your stance</Label>
          <Select defaultValue="explain">
            <SelectTrigger className="mt-1.5 h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="explain">I'd like to explain</SelectItem>
              <SelectItem value="partial">Offer partial refund</SelectItem>
              <SelectItem value="full">Accept full refund</SelectItem>
              <SelectItem value="counter">Counter the claim</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="msg">Your message</Label>
          <Textarea
            id="msg"
            className="mt-1.5 min-h-[110px]"
            placeholder={
              dispute.status === "direct_resolution"
                ? "Write directly to the buyer. Try to resolve it here before a mediator gets involved."
                : "Calmly explain what happened. Be specific. Mediators read everything."
            }
          />
        </div>

        <div>
          <Label>Evidence (photos, screenshots, receipts)</Label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[0, 1].map((i) => (
              <ProductImage
                key={i}
                image={{ seed: `evidence-s-${i}`, hueA: 200, hueB: 220, label: "evidence" }}
                className="aspect-square"
                rounded="rounded-lg"
              />
            ))}
            <button className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-ink-soft hover:border-brand/40 hover:bg-brand-soft/30 hover:text-brand">
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px] font-medium">Add</span>
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="h-11 flex-1">
            Save draft
          </Button>
          <Button className="h-11 flex-[2] bg-brand text-brand-foreground hover:bg-brand/90">
            {dispute.status === "direct_resolution" ? "Send to buyer" : "Submit to mediator"}
          </Button>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                              HELPERS                                       */
/* -------------------------------------------------------------------------- */

type Order = NonNullable<ReturnType<typeof getOrder>>;
type Listing = NonNullable<ReturnType<typeof getListing>>;

function buildTimeline(d: Dispute, order: Order, listing: Listing): TimelineStep[] {
  const base: TimelineStep[] = [
    {
      key: "ord",
      title: "Order placed",
      description: `${order.buyerName} bought ${listing.title}`,
      at: formatTime(order.createdAt),
      state: "done" as const,
    },
    {
      key: "esc",
      title: "Payment locked",
      description: `${formatNGN(order.amountNGN)} in SafeSale escrow`,
      at: formatTime(order.updatedAt),
      state: "done" as const,
    },
    {
      key: "ship",
      title: "Shipped",
      description: order.trackingNumber ? `${order.carrier} ${order.trackingNumber}` : undefined,
      at: order.shippedAt ? formatTime(order.shippedAt) : undefined,
      state: order.shippedAt ? ("done" as const) : ("pending" as const),
    },
    {
      key: "del",
      title: "Delivered",
      at: order.deliveredAt ? formatTime(order.deliveredAt) : undefined,
      state: order.deliveredAt ? ("done" as const) : ("pending" as const),
    },
    {
      key: "dsp",
      title: "Dispute opened",
      description: d.summary,
      at: formatRelative(d.openedAt),
      state: "alert" as const,
    },
  ];

  if (d.status === "direct_resolution") {
    base.push({
      key: "direct",
      title: "Direct resolution window (72h)",
      description: "Buyer & seller try to resolve via chat first",
      at: undefined,
      state: "active" as const,
    });
  }
  if (d.status === "escalated" || d.status === "mediating") {
    base.push({
      key: "escalate",
      title: "Escalated to mediator",
      description: "SafeSale mediator now reviewing the case",
      at: undefined,
      state: "active" as const,
    });
  }
  if (d.status === "evidence_requested") {
    base.push({
      key: "evidence",
      title: "Mediator requested more evidence",
      description: "24-hour window to respond",
      at: undefined,
      state: "alert" as const,
    });
  }
  if (d.status === "resolved" && d.resolution) {
    base.push({
      key: "resolved",
      title: "Resolved",
      description: d.resolution.reasoning,
      at: formatTime(d.resolution.resolvedAt),
      state: "done" as const,
    });
  }
  return base;
}

function Card({ sub, children }: { sub: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border bg-surface-2/30 p-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-soft">
        {sub}
      </p>
      <div className="mt-2 flex flex-col items-center">{children}</div>
    </div>
  );
}

function ChatPreview({ m }: { m: (typeof chat)[number] }) {
  if (m.from === "system") {
    return (
      <li className="flex items-center justify-center gap-2 text-[11px] text-ink-soft">
        <ShieldCheck className="h-3 w-3" />
        {m.text}
      </li>
    );
  }
  const isSeller = m.from === "seller";
  return (
    <li className={cn("flex gap-2", isSeller ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
          isSeller
            ? "rounded-br-md bg-brand text-brand-foreground"
            : "rounded-bl-md bg-secondary text-ink"
        )}
      >
        {m.text}
        {m.attachment && (
          <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-[11px]">
            <Upload className="h-3 w-3" /> {m.attachment.label}
          </div>
        )}
      </div>
    </li>
  );
}
