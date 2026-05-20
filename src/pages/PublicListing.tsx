import { useSeoMeta } from "@unhead/react";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { Logo } from "@/components/safesale/Logo";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/safesale/ProductImage";
import { Avatar } from "@/components/safesale/Avatar";
import { StarRating } from "@/components/safesale/StarRating";
import { getListing, getSeller, getReviewsForSeller } from "@/lib/mock";
import { formatNGN, formatRelative } from "@/lib/format";
import {
  ShieldCheck,
  Lock,
  Truck,
  Scale,
  Share2,
  Heart,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PublicListing() {
  const { id = "" } = useParams<{ id: string }>();
  const listing = getListing(id);
  const seller = listing ? getSeller(listing.sellerId) : undefined;
  const reviews = seller ? getReviewsForSeller(seller.id) : [];

  useSeoMeta({
    title: listing ? `${listing.title} — SafeSale` : "Listing — SafeSale",
    description: listing
      ? `${listing.title} by ${seller?.name}. Pay safely with SafeSale escrow.`
      : undefined,
  });

  const [activeImage, setActiveImage] = useState(0);

  if (!listing || !seller) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface text-center">
        <div>
          <p className="text-lg font-medium text-ink">Listing not found</p>
          <Button asChild className="mt-4">
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const img = listing.images[activeImage];

  return (
    <div className="min-h-screen bg-surface">
      {/* compact public header */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="container flex h-14 items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <Logo variant="full" />
          <div className="flex items-center gap-1">
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-secondary hover:text-ink">
              <Heart className="h-4 w-4" />
            </button>
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-soft hover:bg-secondary hover:text-ink">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl pb-32 pt-4 lg:pb-12">
        <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr] lg:gap-10">
          {/* GALLERY */}
          <section>
            <ProductImage
              image={img}
              className="aspect-square w-full lg:aspect-[4/5]"
              rounded="rounded-2xl"
            />
            {listing.images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {listing.images.map((im, i) => (
                  <button
                    key={im.seed}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "overflow-hidden rounded-lg border-2 transition-colors",
                      activeImage === i ? "border-brand" : "border-transparent"
                    )}
                  >
                    <ProductImage image={im} className="aspect-square" rounded="rounded-md" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* INFO */}
          <section className="space-y-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-brand">
                {listing.category}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {listing.title}
              </h1>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">
                {formatNGN(listing.priceNGN)}
              </p>
            </div>

            {/* Seller card */}
            <Link
              to={`/${seller.handle}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-white p-4 transition-colors hover:bg-surface-2/40"
              onClick={(e) => e.preventDefault()}
            >
              <Avatar
                seed={seller.avatarSeed}
                name={seller.name}
                size={48}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-ink">
                    {seller.name}
                  </p>
                  {seller.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand-soft-foreground">
                      <ShieldCheck className="h-2.5 w-2.5" /> Verified
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-soft">
                  <StarRating rating={seller.rating} size={11} />
                  <span className="tabular-nums">
                    {seller.rating.toFixed(1)} · {seller.reviews} reviews
                  </span>
                  <span>·</span>
                  <span>{seller.completedOrders} orders</span>
                </div>
              </div>
            </Link>

            {/* Trust panel */}
            <div className="rounded-2xl border border-emerald-200/60 bg-brand-soft/60 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    You're protected by SafeSale
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                    Your payment is held safely in escrow until you confirm
                    you've received your order. Full refund if anything goes
                    wrong.
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Pillar icon={Lock} label="Held in escrow" />
                <Pillar icon={Truck} label="Tracked delivery" />
                <Pillar icon={Scale} label="Fair dispute" />
              </div>
            </div>

            {/* CTA (desktop) */}
            <div className="hidden lg:block">
              <BuyCTA listingId={listing.id} />
            </div>

            {/* Description */}
            <section>
              <h2 className="text-sm font-semibold text-ink">About this item</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {listing.description}
              </p>
              <dl className="mt-4 grid gap-x-6 gap-y-2 border-t border-border pt-4 text-sm sm:grid-cols-2">
                {listing.variants && (
                  <DescRow k="Size / variant" v={listing.variants.join(", ")} />
                )}
                <DescRow k="In stock" v={listing.inStock > 1 ? `${listing.inStock} available` : "1 available"} />
                <DescRow k="Delivery" v={listing.delivery} />
                <DescRow k="Posted" v={formatRelative(listing.createdAt)} />
              </dl>
            </section>

            {/* Reviews preview */}
            {reviews.length > 0 && (
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink">
                    What buyers say about {seller.name.split(" ")[0]}
                  </h2>
                </div>
                <ul className="mt-3 space-y-3">
                  {reviews.slice(0, 2).map((r) => (
                    <li
                      key={r.id}
                      className="rounded-xl border border-border bg-white p-4"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar seed={r.id} name={r.buyerName} size={28} />
                        <p className="text-sm font-medium text-ink">
                          {r.buyerName}
                        </p>
                        <StarRating rating={r.rating} size={11} />
                        <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-medium text-brand-soft-foreground">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-ink-soft">"{r.text}"</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </section>
        </div>
      </main>

      {/* Sticky bottom CTA - mobile */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-safe pt-3 backdrop-blur lg:hidden">
        <div className="container max-w-md">
          <BuyCTA listingId={listing.id} compact price={listing.priceNGN} />
        </div>
      </div>
    </div>
  );
}

function BuyCTA({
  listingId,
  compact,
  price,
}: {
  listingId: string;
  compact?: boolean;
  price?: number;
}) {
  return (
    <div className={compact ? "flex items-center gap-3" : ""}>
      {compact && price !== undefined && (
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-ink-soft">
            Price
          </span>
          <span className="text-base font-semibold tabular-nums text-ink">
            {formatNGN(price)}
          </span>
        </div>
      )}
      <Button
        asChild
        size="lg"
        className={cn(
          "h-12 rounded-lg bg-brand text-base font-semibold text-brand-foreground shadow-[0_8px_20px_-12px_color-mix(in_oklab,var(--brand)_70%,transparent)] hover:bg-brand/90",
          compact ? "flex-1" : "h-14 w-full text-base"
        )}
      >
        <Link to={`/checkout/${listingId}`}>
          <Lock className="mr-2 h-4 w-4" /> Buy safely
        </Link>
      </Button>
    </div>
  );
}

function Pillar({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-white px-2 py-2.5">
      <Icon className="h-4 w-4 text-brand" />
      <span className="text-[10px] font-medium text-ink">{label}</span>
    </div>
  );
}

function DescRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/50 py-1.5 sm:border-0">
      <dt className="text-xs text-ink-soft">{k}</dt>
      <dd className="text-sm text-ink">{v}</dd>
    </div>
  );
}


