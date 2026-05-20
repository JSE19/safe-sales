import { useSeoMeta } from "@unhead/react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/safesale/AppShell";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/safesale/Avatar";
import { EscrowStatusPill } from "@/components/safesale/EscrowStatus";
import { ProductImage } from "@/components/safesale/ProductImage";
import { StarRating } from "@/components/safesale/StarRating";
import {
  ArrowUpRight,
  ShieldCheck,
  Plus,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Banknote,
  CircleDollarSign,
  Link2 as LinkIcon,
  Scale,
  Building2,
} from "lucide-react";
import { currentSeller, disputes, earnings, listings, orders } from "@/lib/mock";
import { formatNGN, formatNumber, formatRelative, formatSats } from "@/lib/format";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export default function DashboardHome() {
  useSeoMeta({ title: "Dashboard — SafeSale" });

  const activeOrders = useMemo(
    () =>
      orders.filter((o) =>
        ["pending_payment", "payment_locked", "shipped", "delivered"].includes(
          o.status
        )
      ),
    []
  );

  const recent = orders.slice(0, 4);
  const maxWeekly = Math.max(...earnings.weekly.map((w) => w.value));

  return (
    <AppShell
      title={`Hi, ${currentSeller.name.split(" ")[0]} 👋`}
      subtitle="Here's how your shop is doing today."
    >
      <div className="space-y-6">
        {/* Hero balance card */}
        <section className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-brand to-emerald-700 p-6 text-white shadow-[0_18px_50px_-22px_rgba(15,42,30,0.4)]">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-emerald-400/30 blur-3xl" />
          <div className="absolute -bottom-12 -left-8 h-44 w-44 rounded-full bg-emerald-300/20 blur-3xl" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-100/80">
                Available to withdraw
              </p>
              <p className="mt-1.5 text-3xl font-semibold tracking-tight sm:text-4xl">
                {formatNGN(earnings.availableNGN)}
              </p>
              <div className="mt-2 flex flex-col gap-1 text-xs text-emerald-50/80">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {formatNGN(earnings.pendingNGN)} held safely in escrow
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5" />
                  Pours into GTB ****2841
                </div>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              className="h-9 rounded-lg bg-white px-4 text-sm font-semibold text-brand hover:bg-emerald-50"
            >
              <Link to="/app/earnings">Withdraw</Link>
            </Button>
          </div>

          <div className="relative mt-6 grid grid-cols-3 gap-2 rounded-xl bg-white/10 p-3 backdrop-blur-sm">
            <MiniStat label="This month" value={formatNGN(earnings.thisMonthNGN)} />
            <MiniStat
              label="Lifetime"
              value={formatNGN(earnings.totalLifetimeNGN)}
            />
            <MiniStat
              label="Sats balance"
              value={formatSats(earnings.satsBalance)}
              gold
            />
          </div>
        </section>

        {/* Quick actions */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            to="/app/payment-requests"
            label="New pay link"
            icon={LinkIcon}
            primary
          />
          <QuickAction
            to="/app/listings"
            label="New listing"
            icon={Plus}
          />
          <QuickAction
            to="/app/orders"
            label="Active orders"
            badge={String(activeOrders.length)}
            icon={CircleDollarSign}
          />
          <QuickAction
            to={`/${currentSeller.handle}`}
            label="View public shop"
            icon={Sparkles}
          />
        </div>

        {/* Active disputes alert (only when there are any) */}
        <ActiveDisputesAlert />

        {/* Two-column on large screens */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Weekly chart */}
          <Section
            title="This week"
            subtitle="Daily revenue locked in escrow"
            action={
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <TrendingUp className="h-3.5 w-3.5" /> +28% vs last week
              </span>
            }
            className="lg:col-span-2"
          >
            <div className="grid h-44 grid-cols-7 items-end gap-2 px-2 pt-2">
              {earnings.weekly.map((d, i) => {
                const pct = (d.value / maxWeekly) * 100;
                const isPeak = i === 4;
                return (
                  <div key={d.day} className="flex flex-col items-center gap-2">
                    <div className="relative flex h-full w-full items-end">
                      <div
                        className={cn(
                          "w-full rounded-lg transition-all",
                          isPeak
                            ? "bg-gradient-to-t from-brand to-emerald-400"
                            : "bg-brand/15"
                        )}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-ink-soft">
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* Reputation snapshot */}
          <Section
            title="Reputation"
            subtitle={`@${currentSeller.handle}`}
            action={
              <Link
                to="/app/reputation"
                className="text-xs font-medium text-brand hover:underline"
              >
                View all
              </Link>
            }
          >
            <div className="flex items-center gap-3">
              <Avatar
                seed={currentSeller.avatarSeed}
                name={currentSeller.name}
                size={48}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <p className="text-2xl font-semibold text-ink">
                    {currentSeller.rating.toFixed(1)}
                  </p>
                  <StarRating rating={currentSeller.rating} size={12} />
                </div>
                <p className="text-xs text-ink-soft">
                  from {currentSeller.reviews} verified reviews
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg border border-border bg-surface-2/30 p-3">
                <p className="text-base font-semibold text-ink">
                  {formatNumber(currentSeller.completedOrders)}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-ink-soft">
                  Completed
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface-2/30 p-3">
                <p className="text-base font-semibold text-ink">
                  {currentSeller.responseTimeMins}m
                </p>
                <p className="text-[10px] uppercase tracking-wider text-ink-soft">
                  Reply time
                </p>
              </div>
            </div>
          </Section>
        </div>

        {/* Active orders */}
        <Section
          title="Active orders"
          subtitle="Orders waiting on you or the buyer."
          action={
            <Link to="/app/orders" className="text-xs font-medium text-brand hover:underline">
              View all
            </Link>
          }
        >
          <ul className="divide-y divide-border">
            {recent.map((o) => {
              const listing = listings.find((l) => l.id === o.listingId);
              return (
                <li key={o.id}>
                  <Link
                    to={`/app/orders/${o.shortId}`}
                    className="flex items-center gap-3 py-3 transition-colors hover:bg-surface-2/30"
                  >
                    {listing && (
                      <ProductImage
                        image={listing.images[0]}
                        className="h-12 w-12"
                        rounded="rounded-lg"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-ink">
                          {listing?.title ?? "Order"}
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-soft">
                        {o.shortId} · {o.buyerName} · {formatRelative(o.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink">
                        {formatNGN(o.amountNGN)}
                      </p>
                      <EscrowStatusPill status={o.status} size="sm" className="mt-1" />
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>

        {/* Recent activity */}
        <Section title="Recent activity">
          <ul className="space-y-3">
            <ActivityItem
              icon={Banknote}
              tone="brand"
              title="Payout completed"
              desc={`${formatNGN(124500)} sent to GTB ****2841`}
              when="2 days ago"
            />
            <ActivityItem
              icon={ShieldCheck}
              tone="brand"
              title="Payment locked"
              desc="SS-7421 · Vintage Denim Jacket"
              when="3 hours ago"
            />
            <ActivityItem
              icon={Sparkles}
              tone="gold"
              title="New 5-star review"
              desc='"The bag arrived exactly as described."'
              when="2 days ago"
            />
            <ActivityItem
              icon={ArrowUpRight}
              tone="brand"
              title="Listing performance up"
              desc="Vintage Denim Jacket viewed 184× today"
              when="today"
            />
          </ul>
        </Section>
      </div>
    </AppShell>
  );
}

function Section({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_-16px_rgba(15,42,30,0.12)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function MiniStat({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-100/80">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm font-semibold tracking-tight",
          gold ? "text-amber-200" : "text-white"
        )}
      >
        {value}
      </p>
    </div>
  );
}

function QuickAction({
  to,
  label,
  icon: Icon,
  badge,
  primary,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center justify-between rounded-2xl border p-4 transition-all hover:-translate-y-0.5",
        primary
          ? "border-brand/30 bg-brand text-brand-foreground shadow-[0_12px_30px_-16px_color-mix(in_oklab,var(--brand)_70%,transparent)] hover:bg-brand/90"
          : "border-border bg-white text-ink hover:shadow-[0_8px_20px_-14px_rgba(15,42,30,0.18)]"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-lg",
            primary ? "bg-white/15 text-white" : "bg-brand-soft text-brand-soft-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      {badge ? (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            primary ? "bg-white/15 text-white" : "bg-brand-soft text-brand-soft-foreground"
          )}
        >
          {badge}
        </span>
      ) : (
        <ChevronRight className={cn("h-4 w-4", primary ? "text-white/80" : "text-ink-soft")} />
      )}
    </Link>
  );
}

function ActivityItem({
  icon: Icon,
  title,
  desc,
  when,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  when: string;
  tone: "brand" | "gold";
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={cn(
          "mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full",
          tone === "brand"
            ? "bg-brand-soft text-brand-soft-foreground"
            : "bg-gold-soft text-amber-700"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="truncate text-xs text-ink-soft">{desc}</p>
      </div>
      <span className="text-[11px] text-ink-soft">{when}</span>
    </li>
  );
}

function ActiveDisputesAlert() {
  const active = disputes.filter((d) => d.status !== "resolved");
  if (active.length === 0) return null;
  return (
    <Link
      to="/app/dispute"
      className="group flex items-center gap-3 rounded-2xl border border-rose-200/70 bg-rose-50/60 p-4 transition-colors hover:bg-rose-50"
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
        <Scale className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">
          {active.length} active dispute{active.length === 1 ? "" : "s"} need your response
        </p>
        <p className="mt-0.5 truncate text-xs text-ink-soft">
          Share evidence calmly — most cases resolve within 24 hours.
        </p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-rose-700 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
