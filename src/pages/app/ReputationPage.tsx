import { useSeoMeta } from "@unhead/react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/safesale/AppShell";
import { Avatar } from "@/components/safesale/Avatar";
import { StarRating } from "@/components/safesale/StarRating";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "@/components/ui/qrcode";
import { currentSeller, reviews } from "@/lib/mock";
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Share2,
  Sparkles,
  Star,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import { formatRelative } from "@/lib/format";

export default function ReputationPage() {
  useSeoMeta({ title: "Reputation — SafeSale" });
  const { toast } = useToast();
  const link = `safesale.to/${currentSeller.handle}`;

  // rating distribution
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => Math.round(r.rating) === stars).length +
      (stars === 5 ? 280 : stars === 4 ? 22 : stars === 3 ? 4 : stars === 2 ? 3 : 3);
    return { stars, count };
  });
  const total = distribution.reduce((s, d) => s + d.count, 0);

  return (
    <AppShell title="Reputation" subtitle="Your trust score, in your hands.">
      <div className="space-y-5">
        {/* Hero seller card */}
        <section className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-brand-soft via-white to-white p-6 shadow-[0_8px_24px_-16px_rgba(15,42,30,0.12)]">
          <div className="flex items-start gap-4">
            <Avatar
              seed={currentSeller.avatarSeed}
              name={currentSeller.name}
              size={64}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-lg font-semibold text-ink">
                  {currentSeller.name}
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand-soft-foreground ring-1 ring-inset ring-emerald-200">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              </div>
              <p className="truncate text-sm text-ink-soft">
                @{currentSeller.handle} · {currentSeller.location}
              </p>
              <p className="mt-2 line-clamp-2 max-w-md text-sm text-ink-soft">
                {currentSeller.bio}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 divide-x divide-emerald-100/60 rounded-xl border border-emerald-100/60 bg-white/70">
            <Stat label="Rating" value={currentSeller.rating.toFixed(1)} sub={`${currentSeller.reviews} reviews`} />
            <Stat
              label="Orders"
              value={String(currentSeller.completedOrders)}
              sub="completed"
            />
            <Stat
              label="Reply time"
              value={`${currentSeller.responseTimeMins}m`}
              sub="avg"
            />
          </div>
        </section>

        {/* Share my shop — the storefront link */}
        <section className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                Your storefront link
              </h2>
              <p className="mt-0.5 text-xs text-ink-soft">
                The one link to put in your Instagram bio, WhatsApp About, or
                TikTok profile. Replaces your Linktree.
              </p>
            </div>
            <Link
              to={`/${currentSeller.handle}`}
              className="hidden text-xs font-medium text-brand hover:underline sm:inline-block"
            >
              Preview as buyer ↗
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr,auto] sm:items-center">
            <div className="flex items-stretch rounded-lg border border-border bg-surface-2/30">
              <div className="flex flex-1 items-center gap-2 truncate px-3 text-sm text-ink">
                {link}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(link);
                  toast({ title: "Storefront link copied" });
                }}
                className="inline-flex items-center gap-1 border-l border-border px-3 text-sm font-medium text-brand hover:bg-brand-soft/40"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
              <button
                onClick={() => toast({ title: "Sharing options opened" })}
                className="inline-flex items-center gap-1 border-l border-border px-3 text-sm font-medium text-brand hover:bg-brand-soft/40"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
            <div className="hidden rounded-lg border border-border bg-white p-2 sm:block">
              <QRCodeCanvas value={`https://${link}`} size={84} className="h-20 w-20" />
            </div>
          </div>

          {/* Link types explainer */}
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              What link to share when
            </p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-3">
              <LinkTypeCard
                title="Storefront"
                example={`safesale.to/${currentSeller.handle}`}
                useWhen="In your IG bio, WhatsApp About, TikTok profile."
                emphasis
              />
              <LinkTypeCard
                title="Product"
                example={`safesale.to/${currentSeller.handle}/<product>`}
                useWhen="When you post a product to stories or DM a buyer."
              />
              <LinkTypeCard
                title="Payment request"
                example="safesale.to/pay/X7K2N4"
                useWhen="For negotiated custom orders. Generate in Payment requests."
                cta={{ to: "/app/payment-requests", label: "Create one" }}
              />
            </ul>
          </div>
        </section>

        {/* Distribution */}
        <section className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-white p-5 lg:col-span-1">
            <h2 className="text-sm font-semibold text-ink">Score breakdown</h2>
            <div className="mt-4 flex items-end gap-3">
              <p className="text-4xl font-semibold text-ink">
                {currentSeller.rating.toFixed(1)}
              </p>
              <div className="pb-1">
                <StarRating rating={currentSeller.rating} size={14} />
                <p className="mt-1 text-xs text-ink-soft">
                  {currentSeller.reviews} verified reviews
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {distribution.map((d) => {
                const pct = (d.count / total) * 100;
                return (
                  <div key={d.stars} className="flex items-center gap-2 text-xs">
                    <span className="inline-flex w-8 items-center gap-0.5 text-ink-soft">
                      {d.stars}
                      <Star
                        className="h-3 w-3 text-amber-500"
                        fill="currentColor"
                      />
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right tabular-nums text-ink-soft">
                      {d.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Trust metrics</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand-soft-foreground">
                <Sparkles className="h-3 w-3" /> Top 3% in Lagos
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <TrustMetric
                icon={CheckCircle2}
                label="Orders completed dispute-free"
                value="99.4%"
                hint="487 of 490 orders"
              />
              <TrustMetric
                icon={CheckCircle2}
                label="Items as described"
                value="98.8%"
                hint="based on buyer confirmations"
              />
              <TrustMetric
                icon={CheckCircle2}
                label="Shipped within 24h"
                value="96.2%"
                hint="last 90 days"
              />
              <TrustMetric
                icon={CheckCircle2}
                label="Replies within 1h"
                value="94.7%"
                hint="avg response time 12 min"
              />
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Recent reviews</h2>
            <FilterTabs />
          </div>
          <ul className="mt-4 divide-y divide-border">
            {reviews.map((r) => (
              <li key={r.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <Avatar seed={r.id} name={r.buyerName} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-sm font-medium text-ink">
                        {r.buyerName}
                      </p>
                      <StarRating rating={r.rating} size={12} />
                      {r.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand-soft-foreground">
                          <ShieldCheck className="h-2.5 w-2.5" />
                          Verified buyer
                        </span>
                      )}
                      <span className="ml-auto text-[11px] text-ink-soft">
                        {formatRelative(r.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink">
                      "{r.text}"
                    </p>
                    <p className="mt-1.5 text-xs text-ink-soft">
                      Order: {r.product}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Button variant="outline" className="mt-4 w-full">
            Load more reviews
          </Button>
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="p-4 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-soft">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
      <p className="text-[10px] text-ink-soft">{sub}</p>
    </div>
  );
}

function TrustMetric({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/30 p-4">
      <Icon className="h-4 w-4 text-brand" />
      <p className="mt-3 text-lg font-semibold tabular-nums text-ink">{value}</p>
      <p className="text-xs font-medium text-ink">{label}</p>
      <p className="mt-0.5 text-[11px] text-ink-soft">{hint}</p>
    </div>
  );
}

function FilterTabs() {
  const [active, setActive] = useState("all");
  const tabs = [
    { k: "all", l: "All" },
    { k: "5", l: "5 ★" },
    { k: "with", l: "With photos" },
  ];
  return (
    <div className="inline-flex rounded-full border border-border bg-surface-2/30 p-0.5 text-xs">
      {tabs.map((t) => (
        <button
          key={t.k}
          onClick={() => setActive(t.k)}
          className={
            "rounded-full px-2.5 py-1 font-medium transition-colors " +
            (active === t.k
              ? "bg-white text-ink shadow-sm"
              : "text-ink-soft hover:text-ink")
          }
        >
          {t.l}
        </button>
      ))}
    </div>
  );
}

function LinkTypeCard({
  title,
  example,
  useWhen,
  emphasis,
  cta,
}: {
  title: string;
  example: string;
  useWhen: string;
  emphasis?: boolean;
  cta?: { to: string; label: string };
}) {
  return (
    <li
      className={cn(
        "flex flex-col rounded-xl border p-3.5",
        emphasis
          ? "border-emerald-200/60 bg-brand-soft/40"
          : "border-border bg-surface-2/30"
      )}
    >
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {emphasis && (
          <span className="rounded-full bg-brand px-1.5 py-0.5 text-[9px] font-medium text-brand-foreground">
            Main
          </span>
        )}
      </div>
      <p className="mt-1.5 truncate font-mono text-[11px] text-ink-soft">
        {example}
      </p>
      <p className="mt-2 flex-1 text-xs text-ink-soft">{useWhen}</p>
      {cta && (
        <Link
          to={cta.to}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
        >
          {cta.label} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </li>
  );
}
