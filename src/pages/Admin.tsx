import { useSeoMeta } from "@unhead/react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/safesale/Logo";
import { Avatar } from "@/components/safesale/Avatar";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ProductImage } from "@/components/safesale/ProductImage";
import { Timeline } from "@/components/safesale/Timeline";
import {
  disputes,
  getOrder,
  getListing,
  currentSeller,
  chat,
} from "@/lib/mock";
import { formatNGN, formatRelative, formatTime } from "@/lib/format";
import {
  Search,
  ImageIcon,
  ArrowRight,
  ChevronLeft,
  Undo2,
  CheckCircle2,
  Split,
  MessageSquare,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DisputeResolutionCard } from "@/components/safesale/DisputeResolution";
import { ReturnFlow } from "@/components/safesale/ReturnFlow";
import { cn } from "@/lib/utils";
import type { Dispute, DisputeResolution } from "@/lib/types";

export default function Admin() {
  useSeoMeta({ title: "Mediator portal — SafeSale" });
  const [selectedId, setSelectedId] = useState<string>(disputes[0].id);
  const selected = disputes.find((d) => d.id === selectedId)!;

  return (
    <div className="min-h-screen bg-surface text-foreground">
      <header className="border-b border-border bg-background">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Site
            </Link>
            <span className="hidden h-4 w-px bg-border sm:block" />
            <Logo />
            <span className="hidden rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-ink-soft sm:inline-block">
              Mediator portal
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-ink-soft md:inline-block">
              Mediator
            </span>
            <Avatar seed="mediator-1" name="Niyi" size={32} />
          </div>
        </div>
      </header>

      <div className="grid h-[calc(100dvh-3.5rem)] grid-rows-[auto,1fr] lg:grid-cols-[320px,1fr] lg:grid-rows-1">
        {/* Queue */}
        <aside className="border-b border-border bg-background lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="sticky top-0 z-10 border-b border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Dispute queue</h2>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
                {disputes.filter((d) => d.status !== "resolved").length} open
              </span>
            </div>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
              <Input
                placeholder="Search disputes"
                className="h-9 pl-8 text-sm"
              />
            </div>
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {["All", "Direct", "Escalated", "Evidence", "Resolved"].map((t) => (
                <button
                  key={t}
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 font-medium transition-colors",
                    t === "All"
                      ? "border-ink bg-ink text-background"
                      : "border-border bg-white text-ink-soft hover:text-ink"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <ul className="divide-y divide-border">
            {disputes.map((d) => (
              <li key={d.id}>
                <button
                  onClick={() => setSelectedId(d.id)}
                  className={cn(
                    "block w-full px-4 py-3 text-left transition-colors",
                    d.id === selectedId
                      ? "bg-brand-soft/40"
                      : "hover:bg-secondary"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {d.reason}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-ink-soft">
                        {d.orderId} · {formatNGN(d.amountNGN)} ·{" "}
                        {formatRelative(d.openedAt)}
                      </p>
                    </div>
                    <PriorityDot priority={d.priority} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px]">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-medium",
                        d.status === "direct_resolution" && "bg-amber-100 text-amber-800",
                        d.status === "escalated" && "bg-rose-100 text-rose-700",
                        d.status === "evidence_requested" && "bg-rose-100 text-rose-700",
                        d.status === "mediating" && "bg-sky-100 text-sky-700",
                        d.status === "resolved" && "bg-emerald-100 text-emerald-800"
                      )}
                    >
                      {d.status.replace(/_/g, " ")}
                    </span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-ink-soft">
                      <ImageIcon className="mr-0.5 inline h-2.5 w-2.5" />
                      buyer {d.buyerEvidence}
                    </span>
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-ink-soft">
                      <ImageIcon className="mr-0.5 inline h-2.5 w-2.5" />
                      seller {d.sellerEvidence}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Detail */}
        <main className="overflow-y-auto bg-surface">
          <DisputeDetail dispute={selected} />
        </main>
      </div>
    </div>
  );
}

function PriorityDot({ priority }: { priority: Dispute["priority"] }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        priority === "high" && "bg-rose-500",
        priority === "medium" && "bg-amber-500",
        priority === "low" && "bg-slate-400"
      )}
      title={priority}
    />
  );
}

function DisputeDetail({ dispute }: { dispute: Dispute }) {
  const order = getOrder(dispute.orderId);
  const listing = order ? getListing(order.listingId) : undefined;
  const [outcome, setOutcome] = useState<"release" | "refund" | "split">("split");
  const [splitPct, setSplitPct] = useState(60);
  const [reasoning, setReasoning] = useState("");

  // Local resolution state — lets the mediator submit and immediately see
  // the same resolution card the buyer and seller will see.
  const [localResolution, setLocalResolution] = useState<DisputeResolution | null>(
    dispute.resolution ?? null
  );

  // Reset when a different dispute is selected.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setLocalResolution(dispute.resolution ?? null);
    setOutcome("split");
    setSplitPct(60);
    setReasoning("");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [dispute.id, dispute.resolution]);

  const submitResolution = () => {
    const buyerRefundNGN =
      outcome === "refund"
        ? dispute.amountNGN
        : outcome === "release"
          ? 0
          : Math.round((dispute.amountNGN * splitPct) / 100);
    const sellerReleaseNGN = dispute.amountNGN - buyerRefundNGN;
    setLocalResolution({
      outcome,
      buyerRefundNGN,
      sellerReleaseNGN,
      reasoning: reasoning.trim() ||
        (outcome === "release"
          ? "Evidence supports the seller. Full payment released."
          : outcome === "refund"
            ? "Evidence supports the buyer. Full refund issued."
            : "Both sides have valid concerns. Partial split applied."),
      mediator: "You · SafeSale mediator",
      resolvedAt: new Date().toISOString(),
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
                {dispute.reason}
              </span>
              <PriorityDot priority={dispute.priority} />
              <span className="text-[11px] uppercase tracking-wider text-ink-soft">
                {dispute.priority} priority
              </span>
            </div>
            <h1 className="mt-2 text-lg font-semibold tracking-tight text-ink sm:text-xl">
              {order?.shortId} · {listing?.title}
            </h1>
            <p className="mt-1 text-xs text-ink-soft">
              Opened {formatRelative(dispute.openedAt)} by{" "}
              <span className="font-medium text-ink">{dispute.openedBy}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-ink-soft">
              Amount in escrow
            </p>
            <p className="text-2xl font-semibold tabular-nums text-ink">
              {formatNGN(dispute.amountNGN)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Buyer" value={order?.buyerName ?? ""} />
          <Stat label="Seller" value={currentSeller.name} />
          <Stat label="Time elapsed" value={formatRelative(dispute.openedAt)} />
          <Stat label="Status" value={dispute.status} />
        </div>
      </div>

      {/* Return-flow widget (only when this dispute is a return) */}
      {dispute.isReturn && (
        <ReturnFlow evidence={dispute.returnEvidence} viewer="admin" />
      )}

      {/* Split evidence */}
      <div className="grid gap-4 lg:grid-cols-2">
        <EvidencePanel
          side="buyer"
          name={order?.buyerName ?? ""}
          summary={dispute.summary}
          imageCount={dispute.buyerEvidence}
          seed={`b-${dispute.id}`}
        />
        <EvidencePanel
          side="seller"
          name={currentSeller.name}
          summary="Item was shipped with photo proof. Buyer's claim does not match our packaging logs."
          imageCount={dispute.sellerEvidence}
          seed={`s-${dispute.id}`}
        />
      </div>

      {/* Timeline + chat history */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-5">
          <h2 className="text-sm font-semibold text-ink">Order timeline</h2>
          {order && (
            <Timeline
              className="mt-4"
              steps={[
                { key: "p", title: "Order placed", at: formatTime(order.createdAt), state: "done" },
                { key: "e", title: "Payment locked", at: formatTime(order.updatedAt), state: "done" },
                {
                  key: "s",
                  title: "Shipped",
                  description: order.trackingNumber
                    ? `${order.carrier} ${order.trackingNumber}`
                    : undefined,
                  at: order.shippedAt && formatTime(order.shippedAt),
                  state: order.shippedAt ? "done" : "pending",
                },
                {
                  key: "d",
                  title: "Delivered",
                  at: order.deliveredAt && formatTime(order.deliveredAt),
                  state: order.deliveredAt ? "done" : "pending",
                },
                { key: "dsp", title: "Dispute opened", at: formatRelative(dispute.openedAt), state: "alert" },
                { key: "med", title: "Awaiting your decision", state: "active" },
              ]}
            />
          )}
        </div>

        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
              <MessageSquare className="h-3.5 w-3.5 text-ink-soft" /> Chat history
            </h2>
            <span className="text-[11px] text-ink-soft">{chat.length} messages</span>
          </div>
          <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
            {chat.map((m) => (
              <li
                key={m.id}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs",
                  m.from === "system" && "border border-border bg-surface-2/30 text-center text-ink-soft",
                  m.from === "buyer" && "mr-6 bg-secondary text-ink",
                  m.from === "seller" && "ml-6 bg-brand text-brand-foreground"
                )}
              >
                <p className="text-[10px] opacity-70">
                  {m.from === "system" ? "System" : m.from === "buyer" ? "Buyer" : "Seller"} ·{" "}
                  {formatTime(m.at)}
                </p>
                <p className="mt-0.5">{m.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Resolved state or controls */}
      {localResolution ? (
        <div className="space-y-3">
          <DisputeResolutionCard resolution={localResolution} viewer="admin" />
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-white px-4 py-3 text-xs text-ink-soft">
            <span>Both parties have been notified and can see this outcome on their order pages.</span>
            <button
              onClick={() => setLocalResolution(null)}
              className="font-medium text-brand hover:underline"
            >
              Demo: reset & resolve again
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200/60 bg-white p-5 shadow-[0_8px_24px_-16px_rgba(15,42,30,0.15)]">
          <h2 className="text-sm font-semibold text-ink">Resolve this dispute</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Your decision is binding. Funds release the moment you confirm.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Option
              active={outcome === "release"}
              onClick={() => setOutcome("release")}
              icon={CheckCircle2}
              tone="brand"
              title="Full release"
              body={`${formatNGN(dispute.amountNGN)} to seller`}
            />
            <Option
              active={outcome === "refund"}
              onClick={() => setOutcome("refund")}
              icon={Undo2}
              tone="rose"
              title="Full refund"
              body={`${formatNGN(dispute.amountNGN)} to buyer`}
            />
            <Option
              active={outcome === "split"}
              onClick={() => setOutcome("split")}
              icon={Split}
              tone="indigo"
              title="Partial split"
              body="Custom share"
            />
          </div>

          {outcome === "split" && (
            <div className="mt-5 rounded-xl border border-border bg-surface-2/30 p-4">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-ink">Buyer refund</span>
                <span className="font-semibold tabular-nums text-ink">
                  {formatNGN(Math.round((dispute.amountNGN * splitPct) / 100))}
                </span>
              </div>
              <Slider
                value={[splitPct]}
                max={100}
                step={5}
                onValueChange={([v]) => setSplitPct(v)}
                className="mt-3"
              />
              <div className="mt-2 flex items-baseline justify-between text-xs text-ink-soft">
                <span>{splitPct}% to buyer</span>
                <span>{100 - splitPct}% to seller</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between text-sm">
                <span className="font-medium text-ink">Seller release</span>
                <span className="font-semibold tabular-nums text-ink">
                  {formatNGN(Math.round((dispute.amountNGN * (100 - splitPct)) / 100))}
                </span>
              </div>
            </div>
          )}

          {/* Mediator reasoning */}
          <div className="mt-5">
            <label htmlFor="reasoning" className="text-xs font-medium text-ink">
              Reasoning (shown to both parties)
            </label>
            <Textarea
              id="reasoning"
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Briefly explain how you weighed the evidence."
              className="mt-1.5 min-h-[80px]"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="outline" className="flex-1">
              <Layers className="mr-1 h-4 w-4" /> Request more evidence
            </Button>
            <Button
              onClick={submitResolution}
              className="flex-[2] bg-brand text-brand-foreground hover:bg-brand/90"
            >
              Confirm resolution <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/30 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-soft">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium capitalize text-ink">
        {value}
      </p>
    </div>
  );
}

function EvidencePanel({
  side,
  name,
  summary,
  imageCount,
  seed,
}: {
  side: "buyer" | "seller";
  name: string;
  summary: string;
  imageCount: number;
  seed: string;
}) {
  const tone =
    side === "buyer"
      ? "border-rose-200/70 bg-rose-50/30"
      : "border-emerald-200/60 bg-brand-soft/40";
  return (
    <div className={cn("rounded-2xl border bg-white p-5", tone)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar seed={`${side}-${name}`} name={name} size={32} />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">
              {side}
            </p>
            <p className="text-sm font-semibold text-ink">{name}</p>
          </div>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-ink-soft">
          {imageCount} files
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink">"{summary}"</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {Array.from({ length: Math.max(1, imageCount) }).map((_, i) => (
          <ProductImage
            key={i}
            image={{
              seed: `${seed}-${i}`,
              hueA: side === "buyer" ? 0 : 150,
              hueB: side === "buyer" ? 20 : 170,
              label: side,
            }}
            className="aspect-square"
            rounded="rounded-md"
          />
        ))}
      </div>
    </div>
  );
}

function Option({
  icon: Icon,
  title,
  body,
  active,
  onClick,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  active: boolean;
  onClick: () => void;
  tone: "brand" | "rose" | "indigo";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-all",
        active
          ? tone === "brand"
            ? "border-brand bg-brand-soft text-ink"
            : tone === "rose"
              ? "border-rose-300 bg-rose-50 text-ink"
              : "border-indigo-300 bg-indigo-50 text-ink"
          : "border-border bg-white text-ink-soft hover:border-ink/30"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5",
          tone === "brand" && "text-brand",
          tone === "rose" && "text-rose-600",
          tone === "indigo" && "text-indigo-600"
        )}
      />
      <p className="mt-2 text-sm font-semibold text-ink">{title}</p>
      <p className="text-[11px]">{body}</p>
    </button>
  );
}


