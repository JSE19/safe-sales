import { useSeoMeta } from "@unhead/react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Logo } from "@/components/safesale/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/safesale/Avatar";
import { StarRating } from "@/components/safesale/StarRating";
import { EscrowShield } from "@/components/safesale/EscrowShield";
import { Countdown } from "@/components/safesale/Countdown";
import {
  getPaymentRequest,
  getSeller,
  paymentRequests,
} from "@/lib/mock";
import { formatNGN } from "@/lib/format";
import { useToast } from "@/hooks/useToast";
import {
  ShieldCheck,
  ChevronLeft,
  Copy,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Lock,
  Truck,
  Clock,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "details" | "instructions" | "waiting" | "detected" | "secured";

export default function PayLink() {
  const { code = "" } = useParams<{ code: string }>();
  // Show the pending demo request by default if code doesn't match anything.
  const pr =
    getPaymentRequest(code) ??
    paymentRequests.find((p) => p.status === "pending") ??
    paymentRequests[0];

  const seller = pr ? getSeller(pr.sellerId) : undefined;

  useSeoMeta({
    title: pr
      ? `Pay ${formatNGN(pr.amountNGN)} to ${seller?.name ?? "seller"} — SafeSale`
      : "Pay — SafeSale",
  });

  const [step, setStep] = useState<Step>("details");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  useEffect(() => {
    if (step === "waiting") {
      const t = setTimeout(() => setStep("detected"), 4500);
      return () => clearTimeout(t);
    }
    if (step === "detected") {
      const t = setTimeout(() => setStep("secured"), 2000);
      return () => clearTimeout(t);
    }
  }, [step]);

  if (!pr || !seller) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface text-center">
        <div>
          <Logo />
          <p className="mt-6 text-lg font-medium text-ink">
            Pay link not found
          </p>
        </div>
      </div>
    );
  }

  if (pr.status === "expired" || pr.status === "cancelled") {
    return <ExpiredView pr={pr} sellerHandle={seller.handle} />;
  }

  if (pr.status === "paid") {
    return <AlreadyPaidView pr={pr} sellerHandle={seller.handle} />;
  }

  const valid = buyerName.trim().length > 1 && buyerPhone.trim().length >= 7;

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link
            to={`/${seller.handle}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Seller shop
          </Link>
          <Logo />
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-soft-foreground">
            <ShieldCheck className="h-3 w-3" />
            Secure
          </span>
        </div>
      </header>

      <main className="container max-w-xl pb-12 pt-6">
        {/* Receipt header */}
        <section className="overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_-16px_rgba(15,42,30,0.12)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">
                You're paying
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">
                {formatNGN(pr.amountNGN)}
              </p>
              <p className="mt-2 text-sm text-ink">{pr.description}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
              <Clock className="h-2.5 w-2.5" />
              <Countdown targetIso={pr.expiresAt} />
            </span>
          </div>

          <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
            <Avatar seed={seller.avatarSeed} name={seller.name} size={40} />
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
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-soft">
                <StarRating rating={seller.rating} size={11} />
                <span>{seller.rating.toFixed(1)} · {seller.reviews} reviews</span>
              </div>
            </div>
            <Link
              to={`/${seller.handle}`}
              className="text-xs font-medium text-brand hover:underline"
            >
              View shop
            </Link>
          </div>
        </section>

        {/* Trust strip */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-emerald-200/60 bg-brand-soft/40 p-2 text-center">
          <Pillar icon={Lock} label="Held in escrow" />
          <Pillar icon={Truck} label="Tracked delivery" />
          <Pillar icon={ShieldCheck} label="Refund if needed" />
        </div>

        {/* Step content */}
        <div className="mt-6 space-y-5">
          {step === "details" && (
            <Card title="Your contact details" subtitle="So the seller can reach you about delivery.">
              <div className="space-y-4">
                <div>
                  <Label>Full name</Label>
                  <Input
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Jane Adekola"
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label>Phone number</Label>
                  <Input
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="+234 803 555 0142"
                    type="tel"
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>
              <Button
                disabled={!valid}
                onClick={() => setStep("instructions")}
                size="lg"
                className="mt-5 h-12 w-full rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
              >
                Continue to payment <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Card>
          )}

          {step === "instructions" && (
            <Card title="Transfer to escrow" subtitle="Send the exact amount. Your money is held safely until you confirm delivery.">
              <div className="rounded-xl border border-amber-200/60 bg-amber-50/60 px-4 py-3 text-amber-900">
                <p className="inline-flex items-center gap-1.5 text-xs">
                  <Countdown targetIso={pr.expiresAt} prefix="Pay link expires in" />
                </p>
              </div>
              <PayRows amount={pr.amountNGN} />
              <div className="mt-5 rounded-xl border border-emerald-200/60 bg-brand-soft/50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                  <div className="text-xs leading-relaxed text-ink-soft">
                    <p className="text-sm font-medium text-ink">
                      This is a SafeSale escrow account
                    </p>
                    <p className="mt-1">
                      {seller.name} cannot access your money. It's only
                      released when you confirm delivery — or refunded if
                      something goes wrong.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setStep("waiting")}
                size="lg"
                className="mt-5 h-12 w-full rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
              >
                I've sent the transfer
              </Button>
              <p className="mt-2 text-center text-[11px] text-ink-soft">
                We usually detect bank transfers within 60 seconds.
              </p>
            </Card>
          )}

          {step === "waiting" && (
            <Card title="Waiting for your payment" subtitle="As soon as the transfer arrives, we'll lock it in escrow for your protection.">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white px-6 py-10 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
                <p className="mt-4 text-sm font-medium text-ink">
                  Listening for your transfer…
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  {formatNGN(pr.amountNGN)} expected
                </p>
              </div>
            </Card>
          )}

          {step === "detected" && (
            <Card title="Payment detected" subtitle="Verifying & moving into escrow…">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200/70 bg-brand-soft/50 px-6 py-10 text-center">
                <span className="relative inline-flex">
                  <span className="absolute inset-0 rounded-full bg-brand/20 animate-lock-pulse" />
                  <CheckCircle2 className="relative h-12 w-12 text-brand" />
                </span>
                <p className="mt-4 text-base font-semibold text-ink">
                  {formatNGN(pr.amountNGN)} received
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  Locking it in escrow now…
                </p>
              </div>
            </Card>
          )}

          {step === "secured" && (
            <div className="space-y-4 animate-slide-up">
              <EscrowShield
                amount={formatNGN(pr.amountNGN)}
                caption={`${seller.name} has been notified and is preparing your order.`}
              />
              <div className="rounded-2xl border border-border bg-white p-5">
                <p className="text-sm font-semibold text-ink">What happens next?</p>
                <ol className="mt-3 space-y-2 text-sm text-ink-soft">
                  <li className="flex items-start gap-2">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>Money is held safely — {seller.name.split(" ")[0]} can't touch it yet.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>They ship your order with a tracking number.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    <span>You confirm delivery — they get paid in seconds.</span>
                  </li>
                </ol>
              </div>
              <Button
                asChild
                size="lg"
                className="h-12 w-full rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
              >
                {/* For the demo, send them to a real seeded order so they can
                    explore the full buyer-side experience. In production this
                    would be the freshly-created `${orderToken}`. */}
                <Link to="/order/v3pk8nh2rt6mqd4zs9wybc">
                  Track my order <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_-16px_rgba(15,42,30,0.12)]">
      <h2 className="text-base font-semibold tracking-tight text-ink sm:text-lg">
        {title}
      </h2>
      {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function PayRows({ amount }: { amount: number }) {
  const { toast } = useToast();
  const copy = (s: string) => {
    navigator.clipboard?.writeText(s);
    toast({ title: "Copied" });
  };
  const rows = [
    { label: "Bank", value: "Wema Bank", highlight: false },
    { label: "Account number", value: "0124 558 947", highlight: true },
    { label: "Account name", value: "SafeSale Escrow", highlight: false },
    { label: "Amount", value: formatNGN(amount), highlight: true },
  ];
  return (
    <ul className="mt-4 space-y-2 text-sm">
      {rows.map((r) => (
        <li
          key={r.label}
          className={cn(
            "flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2.5",
            r.highlight && "bg-surface-2/30"
          )}
        >
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-ink-soft">
              {r.label}
            </p>
            <p className="text-sm font-semibold tabular-nums text-ink">
              {r.value}
            </p>
          </div>
          <button
            onClick={() => copy(r.value)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-brand-soft/40"
          >
            <Copy className="h-3.5 w-3.5" /> Copy
          </button>
        </li>
      ))}
    </ul>
  );
}

function Pillar({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-white px-2 py-2.5">
      <Icon className="h-4 w-4 text-brand" />
      <span className="text-[10px] font-medium text-ink">{label}</span>
    </div>
  );
}

function ExpiredView({ pr, sellerHandle }: { pr: { description: string; amountNGN: number }; sellerHandle: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-surface px-6 text-center">
      <div className="max-w-md">
        <Logo />
        <Ban className="mx-auto mt-8 h-10 w-10 text-rose-500" />
        <p className="mt-4 text-xl font-semibold tracking-tight text-ink">
          This pay link has expired
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          The link for "{pr.description}" ({formatNGN(pr.amountNGN)}) is no
          longer active. Ask the seller to send you a fresh one.
        </p>
        <Button asChild className="mt-5 bg-brand text-brand-foreground hover:bg-brand/90">
          <Link to={`/${sellerHandle}`}>View seller's shop</Link>
        </Button>
      </div>
    </div>
  );
}

function AlreadyPaidView({ pr, sellerHandle }: { pr: { description: string; amountNGN: number }; sellerHandle: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-surface px-6 text-center">
      <div className="max-w-md">
        <Logo />
        <CheckCircle2 className="mx-auto mt-8 h-10 w-10 text-brand" />
        <p className="mt-4 text-xl font-semibold tracking-tight text-ink">
          Already paid
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          {formatNGN(pr.amountNGN)} for "{pr.description}" has already been
          secured in escrow.
        </p>
        <Button asChild className="mt-5 bg-brand text-brand-foreground hover:bg-brand/90">
          <Link to={`/${sellerHandle}`}>View seller's shop</Link>
        </Button>
      </div>
    </div>
  );
}
