import { useSeoMeta } from "@unhead/react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Logo } from "@/components/safesale/Logo";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/safesale/ProductImage";
import { Avatar } from "@/components/safesale/Avatar";
import { StarRating } from "@/components/safesale/StarRating";
import { EscrowShield } from "@/components/safesale/EscrowShield";
import { Timeline } from "@/components/safesale/Timeline";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getListing, getSeller, getOrderByToken, getDisputeForOrder } from "@/lib/mock";
import { DisputeResolutionCard } from "@/components/safesale/DisputeResolution";
import { ReturnFlow } from "@/components/safesale/ReturnFlow";
import { ReviewPrompt } from "@/components/safesale/ReviewPrompt";
import { formatDate, formatNGN, formatTime } from "@/lib/format";
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  Scale,
  ChevronLeft,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

export default function BuyerOrder() {
  const { token = "" } = useParams<{ token: string }>();
  const order = getOrderByToken(token);
  const listing = order ? getListing(order.listingId) : undefined;
  const seller = listing ? getSeller(listing.sellerId) : undefined;

  useSeoMeta({
    title: listing ? `Your order — ${listing.title}` : "Order — SafeSale",
  });

  const [releaseOpen, setReleaseOpen] = useState(false);
  const [released, setReleased] = useState(false);
  const [autoReleaseAt] = useState(() =>
    new Date(Date.now() + 4 * 86400000).toISOString()
  );
  const { toast } = useToast();

  if (!order || !listing || !seller) {
    return <InvalidOrderToken token={token} />;
  }
  const dispute = getDisputeForOrder(order.id);
  const resolvedDispute = dispute?.status === "resolved" ? dispute : undefined;

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link
            to={`/buy/${listing.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Listing
          </Link>
          <Logo />
          <span className="text-[11px] font-medium text-ink-soft">Order {order.shortId}</span>
        </div>
      </header>

      <main className="container max-w-2xl pb-16 pt-6">
        <div className="space-y-5">
          {resolvedDispute?.resolution ? (
            <DisputeResolutionCard
              resolution={resolvedDispute.resolution}
              viewer="buyer"
            />
          ) : (
            /* Hero shield */
            <EscrowShield
              amount={formatNGN(order.amountNGN)}
              caption={
                released
                  ? "Payment released to seller. Thank you!"
                  : order.status === "shipped"
                    ? "Your seller has shipped. Confirm delivery to release payment."
                    : "Held safely until you confirm delivery."
              }
            />
          )}

          {/* Return flow when this order is mid-return */}
          {dispute?.isReturn && dispute.status !== "resolved" && (
            <ReturnFlow evidence={dispute.returnEvidence} viewer="buyer" />
          )}

          {/* Product summary */}
          <section className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-start gap-3">
              <ProductImage
                image={listing.images[0]}
                className="h-20 w-20 shrink-0"
                rounded="rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold text-ink">
                  {listing.title}
                </p>
                {order.variant && (
                  <p className="mt-0.5 text-xs text-ink-soft">{order.variant}</p>
                )}
                <p className="mt-2 text-base font-semibold text-ink">
                  {formatNGN(order.amountNGN)}
                </p>
              </div>
            </div>
          </section>

          {/* Seller */}
          {listing?.description && (
            <section className="rounded-2xl border border-border bg-white p-5">
              <h2 className="text-sm font-semibold text-ink">About this item</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {listing.description}
              </p>
            </section>
          )}
          <section className="rounded-2xl border border-border bg-white p-4">
            <div className="flex items-center gap-3">
              <Avatar seed={seller.avatarSeed} name={seller.name} size={44} />
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
                  <span>{seller.rating.toFixed(1)} · {seller.reviews} reviews</span>
                </div>
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="rounded-2xl border border-border bg-white p-5">
            <h2 className="text-sm font-semibold text-ink">Order timeline</h2>
            <Timeline
              className="mt-4"
              steps={[
                {
                  key: "p",
                  title: "Order placed",
                  description: formatDate(order.createdAt),
                  at: formatTime(order.createdAt),
                  state: "done",
                },
                {
                  key: "l",
                  title: "Payment locked in escrow",
                  description: "Your money is held safely",
                  at: formatTime(order.updatedAt),
                  state: "done",
                },
                {
                  key: "s",
                  title: "Shipped",
                  description: order.trackingNumber
                    ? `${order.carrier} · ${order.trackingNumber}`
                    : "Awaiting shipment",
                  at: order.shippedAt ? formatTime(order.shippedAt) : undefined,
                  state: order.shippedAt ? "done" : "pending",
                },
                {
                  key: "d",
                  title: "Out for delivery",
                  description: "Expected today or tomorrow",
                  state: order.shippedAt ? "active" : "pending",
                },
                {
                  key: "r",
                  title: released ? "Payment released" : "Awaiting your confirmation",
                  description: released
                    ? "Funds sent to seller"
                    : "Tap below when you've received your order",
                  state: released ? "done" : "pending",
                },
              ]}
            />
          </section>

          {/* Shipment / tracking */}
          {order.trackingNumber && (
            <section className="rounded-2xl border border-border bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <Truck className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">
                    {order.carrier}
                  </p>
                  <p className="text-xs text-ink-soft">
                    Tracking number {order.trackingNumber}
                  </p>
                </div>
                <button className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                  Track <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </section>
          )}

          {/* Actions */}
          {!released && (
            <div className="space-y-3">
              <Button
                onClick={() => setReleaseOpen(true)}
                size="lg"
                className="h-14 w-full rounded-lg bg-brand text-base font-semibold text-brand-foreground shadow-[0_8px_20px_-12px_color-mix(in_oklab,var(--brand)_70%,transparent)] hover:bg-brand/90"
              >
                <CheckCircle2 className="mr-2 h-5 w-5" /> I've received it — release
                payment
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 w-full rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50"
              >
                <Link to="/app/dispute">
                  <Scale className="mr-2 h-4 w-4" /> Something's wrong — open a dispute
                </Link>
              </Button>
              <p className="px-2 text-center text-[11px] leading-relaxed text-ink-soft">
                Auto-releases on{" "}
                {formatDate(autoReleaseAt)}{" "}
                if no action is taken. You can dispute any time before that.
              </p>
            </div>
          )}

          {(released || order.status === "completed") && (
            <div className="space-y-4 animate-slide-up">
              <div className="rounded-2xl border border-emerald-200/60 bg-brand-soft/50 p-5 text-center">
                <Sparkles className="mx-auto h-7 w-7 text-brand" />
                <p className="mt-3 text-base font-semibold text-ink">
                  Thanks for confirming!
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  We've released {formatNGN(order.amountNGN)} to {seller.name}.
                </p>
              </div>
              <ReviewPrompt
                viewer="buyer"
                counterpartyName={seller.name}
                counterpartyAvatarSeed={seller.avatarSeed}
                productLabel={`${listing.title}`}
              />
            </div>
          )}
        </div>
      </main>

      {/* Release confirmation */}
      <Dialog open={releaseOpen} onOpenChange={setReleaseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Release {formatNGN(order.amountNGN)} to {seller.name}?</DialogTitle>
            <DialogDescription>
              Only release when you've physically received your order and
              you're happy with it. This is final.
            </DialogDescription>
          </DialogHeader>
          <div
            className={cn(
              "rounded-xl border border-border bg-surface-2/30 p-3 text-sm",
              "flex items-start gap-3"
            )}
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <p className="text-ink-soft">
              If anything was wrong, tap{" "}
              <span className="font-medium text-ink">Cancel</span> and open a
              dispute instead — your money is still protected.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReleaseOpen(false)}>
              Not yet
            </Button>
            <Button
              onClick={() => {
                setReleased(true);
                setReleaseOpen(false);
                toast({
                  title: "Payment released",
                  description: `${formatNGN(order.amountNGN)} sent to ${seller.name}.`,
                });
              }}
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              <CheckCircle2 className="mr-1 h-4 w-4" /> Release payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvalidOrderToken({ token }: { token: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-surface px-6 text-center">
      <div className="max-w-md">
        <Logo />
        <p className="mt-8 text-xl font-semibold tracking-tight text-ink">
          We couldn't find that order link
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          {token
            ? "The link may be old, mistyped, or never existed."
            : "No order token was provided."}
          {" "}
          Order links are only valid for the buyer they were sent to.
        </p>
        <Button asChild className="mt-5 bg-brand text-brand-foreground hover:bg-brand/90">
          <Link to="/">Back home</Link>
        </Button>
        <p className="mt-4 text-[11px] text-ink-soft">
          Lost your order link? Check the email or SMS we sent you when you paid.
        </p>
      </div>
    </div>
  );
}
