import { useSeoMeta } from "@unhead/react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { MarketingLayout } from "@/components/safesale/MarketingLayout";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/safesale/Avatar";
import { StarRating } from "@/components/safesale/StarRating";
import { ProductImage } from "@/components/safesale/ProductImage";
import { EscrowStatusPill } from "@/components/safesale/EscrowStatus";
import {
  ShieldCheck,
  CheckCircle2,
  Truck,
  MessageCircle,
  Banknote,
  Lock,
  Sparkles,
  ArrowRight,
  Star,
  Scale,
  HeartHandshake,
  ChevronDown,
} from "lucide-react";
import { InstagramIcon } from "@/components/safesale/BrandIcons";
import { formatNGN } from "@/lib/format";
import { cn } from "@/lib/utils";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCurrentSeller } from "@/hooks/useCurrentSeller";

/**
 * Marketing front door. Two responsibilities:
 *
 *   1. Tell new visitors what SafeSale is and route them into
 *      `/onboarding`. The preview blocks on this page are intentionally
 *      stylized as labelled examples — they don't claim to be real
 *      sellers / real listings, so we never have to keep a fixture in
 *      sync with the live database.
 *
 *   2. Bounce already-signed-in users straight to their dashboard.
 *      Otherwise tapping "Start selling" from a logged-in browser tab
 *      just bounces the user back to the same Landing page, which is
 *      both confusing and a real bug we shipped before. Routing rule:
 *
 *        - logged in + has SafeSale seller profile  → /app
 *        - logged in + no seller profile yet         → /onboarding
 *        - logged out                                 → stay on Landing
 *
 *      `useCurrentUser` reads from Nostrify; `useCurrentSeller` reads
 *      the SafeSale-specific record from localStorage that Onboarding
 *      stores after POST /api/sellers.
 */
export default function Landing() {
  useSeoMeta({
    title: "SafeSale — Buy safely from social-media sellers",
    description:
      "SafeSale is escrow for social commerce. Buyers send money, sellers ship, and SafeSale holds the funds until everyone is happy. Works wherever you can paste a link.",
  });

  const { user } = useCurrentUser();
  const [seller] = useCurrentSeller();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    navigate(seller ? "/app" : "/onboarding", { replace: true });
  }, [user, seller, navigate]);

  return (
    <MarketingLayout>
      <Hero />
      <TrustStrip />
      <HowItWorks />
      <WhySafeSale />
      <SellerReputation />
      <EscrowFlow />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </MarketingLayout>
  );
}

/* -------------------------------------------------------------------------- */
/*                Stylized example data (no fixture coupling)                 */
/* -------------------------------------------------------------------------- */

/**
 * The hero phone mockup + seller-reputation block both used to read
 * from `src/lib/mock.ts` — that file is being deleted before submission
 * and the showcase blocks render best as **labelled examples**, not as
 * a pretend real seller. Three small constants below give the preview
 * blocks the data they need without coupling to anything live.
 */

const EXAMPLE_LISTING = {
  title: "Vintage Denim Jacket — Ralph Lauren",
  priceNGN: 28_500,
  imageSeed: "vintage-denim-jacket",
} as const;

const EXAMPLE_SELLER = {
  name: "Amaka O.",
  handle: "amaka.thrift",
  location: "Lagos, NG",
  avatarSeed: "amaka-okafor-example",
  rating: 4.9,
  reviewCount: 184,
  completedOrders: 312,
  responseTimeMins: 9,
} as const;

const EXAMPLE_REVIEWS = [
  {
    id: "r1",
    buyerName: "Tomiwa S.",
    rating: 5,
    text: "Item arrived in perfect condition. First time using escrow — I'd never go back to direct transfer.",
  },
  {
    id: "r2",
    buyerName: "Chioma N.",
    rating: 5,
    text: "Honest seller, fast shipping. The escrow gave me the confidence to actually pay.",
  },
] as const;

/* -------------------------------------------------------------------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
        style={{
          background:
            "radial-gradient(60% 50% at 20% 0%, color-mix(in oklab, var(--brand) 12%, transparent) 0%, transparent 70%), radial-gradient(40% 40% at 90% 10%, color-mix(in oklab, var(--gold) 18%, transparent) 0%, transparent 70%)",
        }}
      />
      <div className="container grid gap-10 pb-12 pt-12 lg:grid-cols-12 lg:gap-12 lg:pb-24 lg:pt-20">
        <div className="lg:col-span-6 lg:pt-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand-soft-foreground ring-1 ring-inset ring-emerald-200/60">
            <Sparkles className="h-3.5 w-3.5" />
            Escrow for social commerce
          </span>
          <h1 className="mt-5 text-[40px] font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-[58px]">
            Buy safely from{" "}
            <span className="bg-gradient-to-r from-brand to-emerald-600 bg-clip-text text-transparent">
              social-media
            </span>{" "}
            sellers.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Send your money. We hold it safely. The seller only gets paid when
            you confirm your order arrived as described — no more chasing
            refunds, no more fear of scams.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-lg bg-brand px-6 text-base font-semibold text-brand-foreground shadow-[0_8px_24px_-8px_color-mix(in_oklab,var(--brand)_70%,transparent)] hover:bg-brand/90"
            >
              <Link to="/onboarding">
                Start selling safely <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-lg border-border bg-white px-6 text-base"
            >
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand" />
              ₦2.4 B protected this year
            </span>
            <span className="inline-flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" fill="currentColor" />
              4.9 avg seller rating
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand" />
              12,400+ sellers
            </span>
          </div>
        </div>

        <div className="relative lg:col-span-6">
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}

function HeroMockup() {
  return (
    <div className="relative mx-auto max-w-md">
      {/* Phone frame */}
      <div className="relative mx-auto w-full overflow-hidden rounded-[36px] border border-border bg-white shadow-[0_30px_80px_-30px_rgba(15,42,30,0.25)]">
        <div className="bg-surface p-3">
          <div className="overflow-hidden rounded-[28px] border border-border/70 bg-white">
            {/* status bar */}
            <div className="flex items-center justify-between px-5 py-2 text-[10px] font-medium text-ink-soft">
              <span>9:41</span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-ink-soft" />
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-ink-soft" />
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-ink-soft" />
              </span>
            </div>
            {/* listing preview */}
            <div className="relative px-4 pb-5">
              <span className="absolute right-6 top-1 z-10 inline-flex items-center rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-medium text-white">
                Example
              </span>
              <ProductImage
                image={{
                  seed: EXAMPLE_LISTING.imageSeed,
                  hueA: 162,
                  hueB: 200,
                  label: EXAMPLE_LISTING.title,
                }}
                className="aspect-[5/4]"
                rounded="rounded-2xl"
              />
              <div className="mt-4 flex items-center gap-2">
                <Avatar
                  seed={EXAMPLE_SELLER.avatarSeed}
                  name={EXAMPLE_SELLER.name}
                  size={28}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {EXAMPLE_SELLER.name}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-ink-soft">
                    <StarRating rating={EXAMPLE_SELLER.rating} size={11} />
                    <span>· {EXAMPLE_SELLER.reviewCount} reviews</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand-soft-foreground">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              </div>
              <h3 className="mt-3 text-[15px] font-semibold leading-snug text-ink">
                {EXAMPLE_LISTING.title}
              </h3>
              <p className="mt-1 text-lg font-semibold text-ink">
                {formatNGN(EXAMPLE_LISTING.priceNGN)}
              </p>
              <button
                type="button"
                disabled
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-brand-foreground opacity-90"
                aria-label="Example buy button (not interactive)"
              >
                <Lock className="h-4 w-4" />
                Buy safely with escrow
              </button>
              <p className="mt-2 text-center text-[11px] text-ink-soft">
                Your payment is protected until you confirm delivery
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating "payment locked" card */}
      <div className="absolute -left-4 top-24 hidden w-60 rotate-[-4deg] rounded-2xl border border-emerald-200/70 bg-white p-3 shadow-[0_20px_40px_-20px_rgba(15,42,30,0.25)] sm:block">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-brand-foreground">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-brand-soft-foreground">
              Payment locked
            </p>
            <p className="text-sm font-semibold text-ink">{formatNGN(28500)}</p>
          </div>
        </div>
      </div>

      {/* Floating seller rating card */}
      <div className="absolute -bottom-4 -right-2 hidden w-56 rotate-[5deg] rounded-2xl border border-border bg-white p-3 shadow-[0_20px_40px_-20px_rgba(15,42,30,0.25)] sm:block">
        <div className="flex items-center gap-2">
          <Avatar seed="tomiwa" name="T" size={32} />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-ink">Tomiwa S.</p>
            <StarRating rating={5} size={11} />
          </div>
        </div>
        <p className="mt-2 line-clamp-2 text-[11px] text-ink-soft">
          “Sneakers were spotless. First time using escrow — I'd never go back.”
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function TrustStrip() {
  const items = [
    { value: "12.4k+", label: "Verified sellers" },
    { value: "₦2.4B", label: "Protected this year" },
    { value: "98.3%", label: "Orders dispute-free" },
    { value: "<6 hrs", label: "Avg dispute resolution" },
  ];
  return (
    <section className="border-y border-border/60 bg-white">
      <div className="container grid grid-cols-2 gap-y-6 py-8 md:grid-cols-4">
        {items.map((i) => (
          <div key={i.label} className="text-center">
            <p className="text-2xl font-bold tracking-tight text-ink lg:text-3xl">
              {i.value}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-ink-soft">
              {i.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: InstagramIcon,
      title: "Seller shares a SafeSale link",
      body: "From Instagram bio, WhatsApp status, or DM. Buyers tap the link and see a beautiful listing with the seller's reputation.",
    },
    {
      n: "02",
      icon: Lock,
      title: "Buyer pays into escrow",
      body: "Money goes into SafeSale escrow, not the seller's account. The seller can see the order is funded and ready to ship.",
    },
    {
      n: "03",
      icon: Truck,
      title: "Seller ships with tracking",
      body: "Seller marks the order as shipped and adds a tracking number. The buyer is notified instantly.",
    },
    {
      n: "04",
      icon: HeartHandshake,
      title: "Buyer confirms — seller paid",
      body: "When the order arrives, the buyer taps Release. Funds land in the seller's bank account within minutes.",
    },
  ];
  return (
    <section id="how-it-works" className="container py-20">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          How it works
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          One simple flow. Everyone protected.
        </h2>
        <p className="mt-4 text-base text-ink-soft">
          SafeSale sits between the buyer and seller so nobody has to trust the
          other upfront.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div
            key={s.n}
            className="group relative rounded-2xl border border-border bg-white p-6 transition-shadow hover:shadow-[0_12px_40px_-20px_rgba(15,42,30,0.18)]"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand-soft-foreground">
                <s.icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold tracking-wider text-muted-foreground">
                {s.n}
              </span>
            </div>
            <h3 className="mt-5 text-base font-semibold text-ink">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function WhySafeSale() {
  return (
    <section className="bg-surface-2/40 py-20">
      <div className="container grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Why SafeSale exists
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Africans lose ₦100B+ a year to social commerce scams.
          </h2>
          <p className="mt-4 text-base text-ink-soft">
            Most sellers in Nigeria, Ghana, and Kenya sell on social media —
            Instagram, WhatsApp, TikTok, Telegram, X. Trust is the only thing
            holding the market back. SafeSale replaces blind trust with
            structured, verifiable protection — so small businesses can grow.
          </p>

          <ul className="mt-7 space-y-3">
            {[
              "Buyers stop fearing fake sellers.",
              "Sellers stop losing customers who don't know them yet.",
              "Disputes get resolved fairly by trained mediators.",
              "Reputation is portable, not locked into any one platform.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-ink">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <ComparisonCard />
        </div>
      </div>
    </section>
  );
}

function ComparisonCard() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-500">
          Without SafeSale
        </p>
        <p className="mt-3 text-sm font-semibold text-ink">Direct bank transfer</p>
        <ul className="mt-4 space-y-2 text-sm text-ink-soft">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
            Buyer hopes seller is real
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
            No recourse if item never arrives
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
            Sellers lose 60% of cold buyers
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
            Reputation lives nowhere
          </li>
        </ul>
      </div>
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-brand-soft to-white p-5 ring-1 ring-emerald-100">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">
          With SafeSale
        </p>
        <p className="mt-3 text-sm font-semibold text-ink">Escrow-protected order</p>
        <ul className="mt-4 space-y-2 text-sm text-ink-soft">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            Payment held until delivery
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            Refund if anything goes wrong
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            Verified seller reputation
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            Fair human mediation
          </li>
        </ul>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SellerReputation() {
  return (
    <section className="container py-20">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="order-2 lg:order-1">
          <div className="relative rounded-2xl border border-border bg-white p-6 shadow-[0_24px_60px_-30px_rgba(15,42,30,0.2)]">
            <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-ink/85 px-2 py-0.5 text-[10px] font-medium text-white">
              Example seller
            </span>
            <div className="flex items-center gap-4">
              <Avatar
                seed={EXAMPLE_SELLER.avatarSeed}
                name={EXAMPLE_SELLER.name}
                size={56}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-base font-semibold text-ink">
                    {EXAMPLE_SELLER.name}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand-soft-foreground">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                </div>
                <p className="truncate text-sm text-ink-soft">
                  @{EXAMPLE_SELLER.handle} · {EXAMPLE_SELLER.location}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-surface-2/40">
              <Stat label="Rating" value={EXAMPLE_SELLER.rating.toFixed(1)} subtext={`${EXAMPLE_SELLER.reviewCount} reviews`} />
              <Stat label="Orders" value={String(EXAMPLE_SELLER.completedOrders)} subtext="completed" />
              <Stat label="Replies in" value={`${EXAMPLE_SELLER.responseTimeMins}m`} subtext="avg" />
            </div>

            <div className="mt-5 space-y-3">
              {EXAMPLE_REVIEWS.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-border bg-surface-2/30 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Avatar seed={r.id} name={r.buyerName} size={28} />
                    <p className="text-xs font-medium text-ink">{r.buyerName}</p>
                    <StarRating rating={r.rating} size={11} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-ink-soft">
                    “{r.text}”
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Reputation that travels
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Your good name, owned by you.
          </h2>
          <p className="mt-4 text-base text-ink-soft">
            Every completed order builds your verified seller reputation. Buyers
            see your real numbers — completed orders, response time, reviews —
            so trust is earned, not claimed.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-ink">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>Cryptographically verified — reviews can't be faked.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>Portable across Instagram, WhatsApp & TikTok shops.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>Yours forever — you keep your reputation when you leave.</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div className="p-3 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-soft">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
      <p className="text-[10px] text-ink-soft">{subtext}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function EscrowFlow() {
  const states = [
    { label: "Pending payment", status: "pending_payment" as const },
    { label: "Payment locked", status: "payment_locked" as const },
    { label: "Shipped", status: "shipped" as const },
    { label: "Delivered", status: "delivered" as const },
    { label: "Completed", status: "completed" as const },
  ];
  return (
    <section id="protection" className="bg-surface-2/40 py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            Escrow flow
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Every order tells you exactly where it stands.
          </h2>
          <p className="mt-4 text-base text-ink-soft">
            Five clear states, no surprises. Both sides always know what's
            happening with their money.
          </p>
        </div>

        <div className="mt-12 overflow-x-auto pb-2">
          <div className="mx-auto flex min-w-[640px] max-w-3xl items-start justify-between gap-3 px-2">
            {states.map((s, i) => (
              <div key={s.label} className="flex flex-col items-center text-center">
                <div className="flex items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-xs font-semibold text-ink">
                    {i + 1}
                  </div>
                  {i < states.length - 1 && (
                    <div className="mx-2 h-px w-12 bg-border" />
                  )}
                </div>
                <div className="mt-3">
                  <EscrowStatusPill status={s.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
          <Card title="Buyer pays" body="Money enters SafeSale escrow. Seller is notified instantly." icon={Banknote} />
          <Card title="Seller ships" body="Order moves through tracked stages with timestamps." icon={Truck} />
          <Card title="Buyer confirms" body="Funds release to seller's bank in minutes." icon={CheckCircle2} />
        </div>
      </div>
    </section>
  );
}

function Card({
  title,
  body,
  icon: Icon,
}: {
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <Icon className="h-5 w-5 text-brand" />
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink-soft">{body}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Testimonials() {
  const items = [
    {
      name: "Tunde Olajide",
      role: "Sneaker reseller, Lagos",
      seed: "tunde",
      quote:
        "Conversion on my Instagram bio link doubled the week I added SafeSale. New buyers actually check out now.",
    },
    {
      name: "Adaeze Eze",
      role: "Skincare brand, Enugu",
      seed: "adaeze",
      quote:
        "I used to lose buyers who said 'send picture of your store'. Now my SafeSale profile does the talking.",
    },
    {
      name: "Kwame Asante",
      role: "Buyer, Accra",
      seed: "kwame",
      quote:
        "First time I paid an Instagram seller without my hands shaking. The locked-payment screen is genuinely calming.",
    },
  ];
  return (
    <section className="container py-20">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          Loved by sellers and buyers
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Real people. Real trust.
        </h2>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {items.map((t) => (
          <figure
            key={t.name}
            className="flex h-full flex-col justify-between rounded-2xl border border-border bg-white p-6"
          >
            <blockquote className="text-[15px] leading-relaxed text-ink">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <Avatar seed={t.seed} name={t.name} size={36} />
              <div>
                <p className="text-sm font-medium text-ink">{t.name}</p>
                <p className="text-xs text-ink-soft">{t.role}</p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function FAQ() {
  const items = [
    {
      q: "Who holds my money during escrow?",
      a: "Nobody — not even SafeSale. Funds are cryptographically locked and can only be released by your action or a mediated decision. We can't move your money on a whim.",
    },
    {
      q: "How long does the seller wait to get paid?",
      a: "The moment the buyer taps Release, the seller's bank account is funded — usually within 60 seconds. If the buyer doesn't respond, payment auto-releases after 7 days of confirmed delivery.",
    },
    {
      q: "What happens if I receive the wrong item?",
      a: "Open a dispute from your order page. Upload photos and a quick description. A trained mediator reviews evidence from both sides and decides within 24 hours.",
    },
    {
      q: "How much does SafeSale cost?",
      a: "1.5% per completed order, paid by the seller. No setup fees, no monthly fees, no payout fees. You only pay when you get paid.",
    },
    {
      q: "Do I need a bank account?",
      a: "Sellers connect a Nigerian bank account to receive payouts. Buyers can pay via bank transfer or card — no account needed.",
    },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-surface-2/40 py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            FAQ
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            The honest answers
          </h2>
        </div>
        <div className="mx-auto mt-10 max-w-2xl divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={it.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-medium text-ink sm:text-base">
                    {it.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-ink-soft transition-transform",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm leading-relaxed text-ink-soft">
                    {it.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function FinalCTA() {
  return (
    <section className="container py-20">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-brand to-emerald-700 p-10 text-center text-white shadow-[0_30px_80px_-30px_rgba(15,42,30,0.4)] sm:p-14">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-400/30 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl" />

        <Scale className="relative mx-auto h-9 w-9 opacity-90" />
        <h2 className="relative mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
          Start selling without fear today.
        </h2>
        <p className="relative mx-auto mt-3 max-w-xl text-base text-emerald-50/90">
          Set up your seller profile in two minutes. No fees until you're paid.
        </p>
        <div className="relative mt-7 flex flex-wrap justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-lg bg-white px-6 text-base font-semibold text-brand hover:bg-emerald-50"
          >
            <Link to="/onboarding">
              Create my SafeSale <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-lg border-white/40 bg-transparent px-6 text-base text-white hover:bg-white/10 hover:text-white"
          >
            <a href="#how-it-works">See how it works</a>
          </Button>
        </div>
        <p className="relative mt-6 inline-flex items-center gap-2 text-xs text-emerald-50/80">
          <MessageCircle className="h-3.5 w-3.5" /> No credit card · No setup ·
          Works wherever you sell — Instagram, WhatsApp, TikTok, X, Telegram, anywhere
        </p>
      </div>
    </section>
  );
}
