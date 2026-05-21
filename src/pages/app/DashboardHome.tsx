/**
 * Seller Dashboard Home — `/app`
 *
 * The first thing a seller sees after signing up. Two states:
 *
 *   1. **Empty (default for new sellers)** — welcome banner, three big
 *      action cards (Create listing / Copy shop link / Preview shop),
 *      a "How SafeSale works" strip, and a zero-state stats row.
 *
 *   2. **Demo (toggle on)** — populated dashboard showing a 7-day
 *      revenue chart, filled stats, and a recent-orders feed. Useful
 *      for demos and for sellers who want to see what a full dashboard
 *      will look like before they make their first sale.
 *
 * Design ported from a Stitch prototype; reworked to use SafeSale's
 * existing green/ink palette, lucide-react icons, and shadcn primitives.
 *
 * Identity: still pulls the seller's display data from the mock
 * `currentSeller` for now. A follow-up PR will switch the whole app
 * to `useCurrentUser` + `useAuthor` once the buyer/seller pubkey
 * plumbing is wired.
 */

import { useSeoMeta } from "@unhead/react";
import { useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Eye,
  Link2 as LinkIcon,
  Lock,
  Plus,
  TrendingUp,
  Truck,
  X,
} from "lucide-react";

import { AppShell } from "@/components/safesale/AppShell";
import { Avatar } from "@/components/safesale/Avatar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/useToast";
import { currentSeller, orders } from "@/lib/mock";
import { formatNGN, formatSats } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function DashboardHome() {
  useSeoMeta({ title: "Home — SafeSale" });

  const [demoMode, setDemoMode] = useState(false);

  // TODO: replace with useCurrentUser() + useAuthor() so seller's name
  // and handle come from their kind 0 profile event.
  const seller = currentSeller;
  const firstName = seller.name.split(" ")[0];
  const shopUrl = `safesale.app/@${seller.handle}`;

  const action = (
    <div className="flex items-center justify-between gap-3">
      <DemoToggle value={demoMode} onChange={setDemoMode} />
      <Button
        asChild
        size="sm"
        className="h-9 bg-brand text-brand-foreground hover:bg-brand/90"
      >
        <Link to="/app/listings">
          <Plus className="mr-1 h-4 w-4" />
          New listing
        </Link>
      </Button>
    </div>
  );

  return (
    <AppShell title="Home" subtitle="Overview and quick actions." action={action}>
      {demoMode ? (
        <DemoDashboard seller={seller} />
      ) : (
        <EmptyDashboard
          seller={seller}
          firstName={firstName}
          shopUrl={shopUrl}
        />
      )}
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Empty state                                   */
/* -------------------------------------------------------------------------- */

function EmptyDashboard({
  seller,
  firstName,
  shopUrl,
}: {
  seller: typeof currentSeller;
  firstName: string;
  shopUrl: string;
}) {
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [howOpen, setHowOpen] = useState(true);
  const { toast } = useToast();

  const copyShopUrl = () => {
    navigator.clipboard?.writeText(`https://${shopUrl}`).then(() => {
      toast({ title: "Shop link copied" });
    });
  };

  return (
    <div className="space-y-8">
      {welcomeOpen && (
        <div className="relative flex items-start justify-between gap-4 rounded-2xl border border-brand/20 bg-brand/5 p-5">
          <div>
            <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
              Welcome, {firstName}
              <span aria-hidden className="text-xl">👋</span>
            </h3>
            <p className="mt-1 text-sm text-ink-soft">
              Let's get your first sale. Set up your shop in minutes.
            </p>
          </div>
          <button
            type="button"
            aria-label="Dismiss welcome banner"
            onClick={() => setWelcomeOpen(false)}
            className="text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 3-card action grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <ActionCard
          emphasized
          icon={Plus}
          title="Create your first listing"
          body="Add details, photos, and set your price in sats."
          cta="Create listing"
          to="/app/listings"
        />

        <CardShell>
          <CardIcon icon={LinkIcon} />
          <h4 className="text-base font-semibold text-ink">Copy your shop link</h4>
          <p className="mt-1 flex-1 text-sm text-ink-soft">
            Paste it in your Instagram bio, WhatsApp About, TikTok profile, X bio — anywhere you sell.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex-1 truncate rounded-full bg-surface px-3 py-1.5 font-mono text-xs text-ink-soft">
              {shopUrl}
            </div>
            <button
              type="button"
              onClick={copyShopUrl}
              aria-label="Copy shop link"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </CardShell>

        <CardShell>
          <CardIcon icon={Eye} />
          <h4 className="text-base font-semibold text-ink">Preview your shop</h4>
          <p className="mt-1 flex-1 text-sm text-ink-soft">
            See what buyers see before you share.
          </p>
          <Button
            asChild
            variant="outline"
            className="mt-4 w-full"
          >
            <Link to={`/${seller.handle}`}>
              Open public shop
              <ArrowUpRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardShell>
      </div>

      {/* How SafeSale works */}
      <section className="rounded-2xl border border-border bg-white p-6">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
          onClick={() => setHowOpen((v) => !v)}
          aria-expanded={howOpen}
        >
          <h4 className="text-base font-semibold text-ink">
            How SafeSale works for sellers
          </h4>
          <ChevronRight
            className={cn(
              "h-4 w-4 text-ink-soft transition-transform",
              howOpen && "rotate-90",
            )}
          />
        </button>

        {howOpen && (
          <div className="mt-5 grid gap-6 border-t border-border pt-5 md:grid-cols-3">
            <HowStep
              n={1}
              icon={Lock}
              label="Buyer pays into escrow"
              body="Their sats are locked safely. They can't be touched without your delivery."
            />
            <HowStep
              n={2}
              icon={Truck}
              label="You ship the order"
              body="Mark it shipped with a tracking number once it's on the way."
            />
            <HowStep
              n={3}
              icon={CheckCircle2}
              label="Get paid in sats"
              body="Buyer confirms receipt → funds release instantly via Lightning."
            />
          </div>
        )}
      </section>

      {/* Stats row (zero-state) */}
      <section>
        <h3 className="mb-4 text-base font-semibold text-ink">Overview</h3>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <ZeroStat label="Sats earned" hint="Start selling to see your first payout" />
          <ZeroStat label="Orders" hint="No orders yet" />
          <ZeroStat label="Reviews" hint="No reviews yet" />
          <ZeroStat label="Buyers reached" hint="Share your shop link to grow" />
        </div>
        <p className="mt-4 text-center text-xs text-ink-soft">
          Your stats will appear here once you make your first sale.
        </p>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Demo state                                    */
/* -------------------------------------------------------------------------- */

const DEMO_DAYS = [
  { day: "Mon", sats: 4800 },
  { day: "Tue", sats: 6200 },
  { day: "Wed", sats: 3100 },
  { day: "Thu", sats: 9700 },
  { day: "Fri", sats: 12500 },
  { day: "Sat", sats: 11200 },
  { day: "Sun", sats: 8800 },
];

function DemoDashboard({ seller }: { seller: typeof currentSeller }) {
  const recent = orders.slice(0, 4);
  const maxBar = Math.max(...DEMO_DAYS.map((d) => d.sats));

  return (
    <div className="space-y-6">
      {/* Filled stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <FilledStat
          label="Sats earned"
          value={formatSats(248_500)}
          sub={`~${formatNGN(362_000)}`}
          trend
        />
        <FilledStat label="Orders (30d)" value="12" />
        <FilledStat label="Reviews" value="4.9 ★" sub="9 total" />
        <FilledStat label="Unique buyers" value="14" />
      </div>

      {/* Chart + Recent orders */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-white p-6 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink">7-Day Revenue</h3>
            <select
              defaultValue="7d"
              aria-label="Time range"
              className="rounded-lg bg-surface px-2 py-1 text-xs font-medium text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
          <div className="grid h-44 grid-cols-7 items-end gap-3 pt-2">
            {DEMO_DAYS.map((d) => {
              const pct = (d.sats / maxBar) * 100;
              return (
                <div key={d.day} className="flex flex-col items-center gap-2">
                  <div className="relative flex h-full w-full items-end">
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-brand to-emerald-400 transition-all"
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
        </section>

        <section className="rounded-2xl border border-border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink">Recent orders</h3>
            <Link
              to="/app/orders"
              className="text-xs font-medium text-brand hover:underline"
            >
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {recent.map((o, i) => {
              const initials = o.buyerName
                .split(" ")
                .slice(0, 2)
                .map((s) => s[0])
                .join("");
              return (
                <li key={o.id ?? i} className="flex items-center gap-3 py-3">
                  <Avatar
                    seed={o.id ?? `o-${i}`}
                    name={o.buyerName}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {o.buyerName}
                    </p>
                    <p className="truncate text-xs text-ink-soft">
                      {formatSats(o.amountSats ?? 12500)} ·{" "}
                      {formatNGN(o.amountNGN ?? 18200)}
                    </p>
                  </div>
                  <DemoBadge status={o.status} />
                  <span className="sr-only">{initials}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <p className="text-center text-xs text-ink-soft">
        Demo data — toggle off to see {seller.name.split(" ")[0]}'s real dashboard.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Reusable pieces                               */
/* -------------------------------------------------------------------------- */

function DemoToggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
      Demo data
      <Switch
        checked={value}
        onCheckedChange={onChange}
        aria-label="Toggle demo data"
      />
    </label>
  );
}

function ActionCard({
  icon: Icon,
  title,
  body,
  cta,
  to,
  emphasized,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  cta: string;
  to: string;
  emphasized?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex h-full flex-col rounded-2xl border bg-white p-6 transition-all hover:shadow-[0_8px_20px_-14px_rgba(15,42,30,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        emphasized
          ? "border-brand/40 ring-1 ring-brand/10 hover:border-brand"
          : "border-border hover:border-ink/20",
      )}
    >
      <CardIcon icon={Icon} emphasized={emphasized} />
      <h4 className="text-base font-semibold text-ink">{title}</h4>
      <p className="mt-1 flex-1 text-sm text-ink-soft">{body}</p>
      <span
        className={cn(
          "mt-4 inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          emphasized
            ? "bg-brand text-brand-foreground group-hover:bg-brand/90"
            : "bg-surface text-ink group-hover:bg-surface/70",
        )}
      >
        {cta}
        <ChevronRight className="ml-1 h-4 w-4" />
      </span>
    </Link>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 transition-all hover:shadow-[0_8px_20px_-14px_rgba(15,42,30,0.18)]">
      {children}
    </div>
  );
}

function CardIcon({
  icon: Icon,
  emphasized,
}: {
  icon: React.ComponentType<{ className?: string }>;
  emphasized?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full",
        emphasized ? "bg-brand/10 text-brand" : "bg-surface text-ink-soft",
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

function HowStep({
  n,
  icon: Icon,
  label,
  body,
}: {
  n: number;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink-soft">
        <Icon className="h-4 w-4" />
      </div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink">
        {n}. {label}
      </p>
      <p className="text-xs text-ink-soft">{body}</p>
    </div>
  );
}

function ZeroStat({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <p className="mb-1 text-xs text-ink-soft">{label}</p>
      <p className="text-2xl font-semibold text-ink tabular-nums">0</p>
      <p className="mt-1 text-[11px] text-ink-soft">{hint}</p>
    </div>
  );
}

function FilledStat({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="mb-1 flex items-center justify-between text-xs text-ink-soft">
        {label}
        {trend && <TrendingUp className="h-3.5 w-3.5 text-brand" />}
      </div>
      <p className="text-2xl font-semibold text-ink tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-ink-soft">{sub}</p>}
    </div>
  );
}

function DemoBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    payment_locked: {
      bg: "bg-amber-100",
      text: "text-amber-800",
      label: "Payment locked",
    },
    shipped: { bg: "bg-blue-100", text: "text-blue-800", label: "Shipped" },
    delivered: { bg: "bg-blue-100", text: "text-blue-800", label: "Delivered" },
    released: {
      bg: "bg-emerald-100",
      text: "text-emerald-800",
      label: "Complete",
    },
    disputed: { bg: "bg-rose-100", text: "text-rose-800", label: "Disputed" },
  };
  const s = map[status] ?? {
    bg: "bg-surface",
    text: "text-ink-soft",
    label: status,
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap",
        s.bg,
        s.text,
      )}
    >
      <Check className="h-2.5 w-2.5 opacity-60" />
      {s.label}
    </span>
  );
}
