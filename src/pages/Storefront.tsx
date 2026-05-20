import { useSeoMeta } from "@unhead/react";
import { Link, useParams } from "react-router-dom";
import { Logo } from "@/components/safesale/Logo";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/safesale/Avatar";
import { StarRating } from "@/components/safesale/StarRating";
import { ProductImage } from "@/components/safesale/ProductImage";
import {
  getSellerByHandle,
  getListingsForSeller,
  getReviewsForSeller,
} from "@/lib/mock";
import { formatNGN, formatNumber, formatRelative } from "@/lib/format";
import {
  ShieldCheck,
  MapPin,
  Clock,
  Package,
  MessageCircle,
  Heart,
  Share2,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Storefront() {
  const { handle = "" } = useParams<{ handle: string }>();
  const seller = getSellerByHandle(handle);
  const [tab, setTab] = useState<"shop" | "reviews">("shop");
  useSeoMeta({
    title: seller ? `${seller.name} — SafeSale` : "Shop — SafeSale",
    description: seller?.bio,
  });

  if (!seller) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface px-6 text-center">
        <div>
          <Logo />
          <p className="mt-6 text-lg font-medium text-ink">
            We couldn't find @{handle}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            The seller may have changed their handle or closed their shop.
          </p>
          <Button asChild className="mt-4 bg-brand text-brand-foreground hover:bg-brand/90">
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const listings = getListingsForSeller(seller.id);
  const reviews = getReviewsForSeller(seller.id);

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            SafeSale
          </Link>
          <Logo variant="full" />
          <div className="flex items-center gap-1">
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-secondary hover:text-ink">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Cover band */}
      <div
        className="h-28 sm:h-36"
        style={{
          background:
            "linear-gradient(120deg, hsl(158 64% 32%), hsl(150 60% 42%) 60%, hsl(38 92% 58%) 130%)",
        }}
      />

      <main className="container max-w-3xl">
        {/* Profile head */}
        <section className="-mt-14 sm:-mt-16">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            <div className="rounded-full bg-background p-1.5 shadow-[0_8px_24px_-12px_rgba(15,42,30,0.25)]">
              <Avatar seed={seller.avatarSeed} name={seller.name} size={96} />
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                  {seller.name}
                </h1>
                {seller.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand-soft-foreground ring-1 ring-inset ring-emerald-200">
                    <ShieldCheck className="h-3 w-3" /> Verified seller
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-ink-soft">
                safesale.to/<span className="font-medium text-ink">{seller.handle}</span>
              </p>
            </div>
          </div>

          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink">
            {seller.bio}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-soft">
            <Meta icon={MapPin}>{seller.location}</Meta>
            <Meta icon={Clock}>Replies in ~{seller.responseTimeMins}m</Meta>
            <Meta icon={Package}>{formatNumber(seller.completedOrders)} orders completed</Meta>
            <Meta icon={CheckCircle2}>Joined {formatRelative(seller.joinedAt)}</Meta>
          </div>

          {/* Stats strip */}
          <div className="mt-6 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-white">
            <Stat label="Rating" value={seller.rating.toFixed(1)} sub={`${seller.reviews} reviews`} />
            <Stat label="Completion" value="99.4%" sub="dispute-free" />
            <Stat label="On time" value="96%" sub="last 90 days" />
          </div>

          {/* Trust panel */}
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200/60 bg-brand-soft/50 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">
                Every order from {seller.name.split(" ")[0]} is escrow-protected
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                Your payment is held safely until you confirm delivery. Full
                refund if anything goes wrong.
              </p>
            </div>
            <Link
              to="/how-it-works"
              className="hidden text-xs font-medium text-brand hover:underline sm:inline-block"
            >
              How it works
            </Link>
          </div>
        </section>

        {/* Tabs */}
        <div className="mt-8 border-b border-border">
          <div className="flex gap-1">
            <Tab active={tab === "shop"} onClick={() => setTab("shop")}>
              Shop <span className="ml-1 text-[11px] text-ink-soft">({listings.length})</span>
            </Tab>
            <Tab active={tab === "reviews"} onClick={() => setTab("reviews")}>
              Reviews <span className="ml-1 text-[11px] text-ink-soft">({seller.reviews})</span>
            </Tab>
          </div>
        </div>

        {/* Content */}
        {tab === "shop" && (
          <section className="mt-5 grid grid-cols-2 gap-3 pb-10 sm:grid-cols-3">
            {listings.map((l) => (
              <Link
                key={l.id}
                to={`/buy/${l.id}`}
                className="group block overflow-hidden rounded-2xl border border-border bg-white transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-16px_rgba(15,42,30,0.18)]"
              >
                <ProductImage
                  image={l.images[0]}
                  className="aspect-[4/5]"
                  rounded="rounded-none"
                />
                <div className="p-3">
                  <p className="line-clamp-2 text-xs font-medium leading-snug text-ink sm:text-sm">
                    {l.title}
                  </p>
                  <p className="mt-1.5 text-sm font-semibold text-ink">
                    {formatNGN(l.priceNGN)}
                  </p>
                </div>
              </Link>
            ))}
            {listings.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center">
                <p className="text-sm font-medium text-ink">
                  No listings yet
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  {seller.name.split(" ")[0]} hasn't posted any products yet.
                </p>
              </div>
            )}
          </section>
        )}

        {tab === "reviews" && (
          <section className="mt-5 space-y-3 pb-10">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-border bg-white p-4"
              >
                <div className="flex items-center gap-2">
                  <Avatar seed={r.id} name={r.buyerName} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ink">{r.buyerName}</p>
                      <StarRating rating={r.rating} size={12} />
                    </div>
                    <p className="text-[11px] text-ink-soft">{r.product}</p>
                  </div>
                  {r.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand-soft-foreground">
                      <ShieldCheck className="h-2.5 w-2.5" /> Verified
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink">"{r.text}"</p>
              </div>
            ))}
          </section>
        )}
      </main>

      {/* Sticky message CTA on mobile */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 pb-safe pt-3 backdrop-blur sm:hidden">
        <div className="container flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-11 w-11">
            <Heart className="h-4 w-4" />
          </Button>
          <Button className="h-11 flex-1 rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90">
            <MessageCircle className="mr-1 h-4 w-4" /> Message {seller.name.split(" ")[0]}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Meta({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="p-4 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-soft">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-ink">{value}</p>
      <p className="text-[10px] text-ink-soft">{sub}</p>
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-brand text-ink"
          : "border-transparent text-ink-soft hover:text-ink"
      )}
    >
      {children}
    </button>
  );
}
