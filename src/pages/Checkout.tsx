import { useSeoMeta } from "@unhead/react";
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Logo } from "@/components/safesale/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/safesale/Avatar";
import { ProductImage } from "@/components/safesale/ProductImage";
import { EscrowShield } from "@/components/safesale/EscrowShield";
import { Countdown } from "@/components/safesale/Countdown";
import { getListing, getSeller, generateOrderToken } from "@/lib/mock";
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
  ImageDown,
  Link2 as LinkIcon,
  MapPin,
  Phone,
  Bookmark,
  Mail,
  Truck,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { cn } from "@/lib/utils";

type Step = "details" | "instructions" | "waiting" | "detected" | "secured";

export default function Checkout() {
  const { id = "" } = useParams<{ id: string }>();
  const listing = getListing(id);
  const seller = listing ? getSeller(listing.sellerId) : undefined;
  const navigate = useNavigate();
  const { toast: _toast } = useToast();

  useSeoMeta({
    title: listing ? `Checkout — ${listing.title}` : "Checkout — SafeSale",
  });

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contactMethod, setContactMethod] = useState<"email" | "phone">("email");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [expiresAt] = useState(() =>
    new Date(Date.now() + 30 * 60_000).toISOString()
  );
  // Order token is generated up front so the same token survives the
  // simulated waiting / detected / secured transitions.
  const [orderToken] = useState(() => generateOrderToken());

  const contactValid =
    contactMethod === "email"
      ? /.+@.+\..+/.test(email)
      : phone.trim().length >= 10; // WhatsApp number usually 10-11 digits

  const valid =
    name.trim().length > 1 &&
    contactValid &&
    address.trim().length > 4 &&
    city.trim().length > 1;

  // Simulate auto-detect transitions
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

  if (!listing || !seller) {
    return (
      <div className="grid min-h-screen place-items-center text-center">
        <div>
          <p className="text-lg font-medium">Listing not found</p>
          <Button asChild className="mt-3">
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link
            to={`/buy/${listing.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-soft hover:text-ink"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <Logo />
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-soft-foreground">
            <ShieldCheck className="h-3 w-3" />
            Secure
          </span>
        </div>
      </header>

      <main className="container max-w-2xl pb-12 pt-6">
        <StepBar step={step} />

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,320px]">
          <div className="space-y-5">
            {step === "details" && (
              <DetailsForm
                name={name}
                setName={setName}
                phone={phone}
                setPhone={setPhone}
                email={email}
                setEmail={setEmail}
                contactMethod={contactMethod}
                setContactMethod={setContactMethod}
                city={city}
                setCity={setCity}
                address={address}
                setAddress={setAddress}
                onSubmit={() => valid && setStep("instructions")}
                valid={valid}
              />
            )}
            {step === "instructions" && (
              <Instructions
                amount={listing.priceNGN}
                expiresAt={expiresAt}
                onConfirm={() => setStep("waiting")}
              />
            )}
            {step === "waiting" && (
              <WaitingPayment amount={listing.priceNGN} expiresAt={expiresAt} />
            )}
            {step === "detected" && <Detected amount={listing.priceNGN} />}
            {step === "secured" && (
              <Secured
                amount={listing.priceNGN}
                orderToken={orderToken}
                contactMethod={contactMethod}
                contactValue={contactMethod === "email" ? email : phone}
                /* In production this routes to /order/${orderToken}. For the
                   demo, send the buyer to a real seeded payment_locked order
                   so they can explore the full tracking experience. */
                onContinue={() => navigate(`/order/k7xq2m9a4npb3hv8yw5jc6`)}
              />
            )}
          </div>

          {/* Order summary - sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-20 lg:h-min">
            <div className="overflow-hidden rounded-2xl border border-border bg-white p-4">
              <div className="flex items-start gap-3">
                <ProductImage
                  image={listing.images[0]}
                  className="h-16 w-16 shrink-0"
                  rounded="rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-ink">
                    {listing.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {formatNGN(listing.priceNGN)}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <Row k="Item" v={formatNGN(listing.priceNGN)} />
                <Row k="Buyer protection" v="Free" />
                <Row k="Delivery" v="Pay seller on agreement" sub />
              </div>
              <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
                <span className="text-xs font-medium uppercase tracking-wider text-ink-soft">
                  Total
                </span>
                <span className="text-lg font-semibold tabular-nums text-ink">
                  {formatNGN(listing.priceNGN)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
              <Avatar seed={seller.avatarSeed} name={seller.name} size={32} />
              <div className="min-w-0 flex-1 text-xs">
                <p className="truncate font-medium text-ink">{seller.name}</p>
                <p className="truncate text-ink-soft">
                  {seller.rating.toFixed(1)} ★ · {seller.reviews} reviews
                </p>
              </div>
              {seller.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand-soft-foreground">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              )}
            </div>

            <Footnote />
          </aside>
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function StepBar({ step }: { step: Step }) {
  const order: Step[] = ["details", "instructions", "waiting", "detected", "secured"];
  const ix = order.indexOf(step);
  const labels = [
    { key: "details", label: "Details" },
    { key: "instructions", label: "Pay" },
    { key: "secured", label: "Done" },
  ];
  const milestones = [0, 1, 4];
  return (
    <div className="flex items-center gap-3">
      {labels.map((l, i) => {
        const active = ix >= milestones[i];
        return (
          <div key={l.key} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold",
                active
                  ? "bg-brand text-brand-foreground"
                  : "bg-secondary text-ink-soft"
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "text-xs font-medium",
                active ? "text-ink" : "text-ink-soft"
              )}
            >
              {l.label}
            </span>
            {i < labels.length - 1 && (
              <span
                className={cn(
                  "ml-1 h-px flex-1",
                  ix > milestones[i] ? "bg-brand/40" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DetailsForm(props: {
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  contactMethod: "email" | "phone";
  setContactMethod: (m: "email" | "phone") => void;
  city: string;
  setCity: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  valid: boolean;
  onSubmit: () => void;
}) {
  return (
    <Card title="Delivery details" subtitle="Where should the seller send your order?">
      <div className="space-y-4">
        <Field
          label="Full name"
          value={props.name}
          onChange={props.setName}
          placeholder="Jane Adekola"
        />

        {/* Contact method — chooses where we send the order link */}
        <div>
          <Label>How should we send your order link?</Label>
          <p className="mt-1 text-xs text-ink-soft">
            Your order link is your only way back to this order. We'll send it
            here so you can return any time.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["email", "phone"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => props.setContactMethod(m)}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
                  props.contactMethod === m
                    ? "border-brand bg-brand-soft text-brand-soft-foreground"
                    : "border-border bg-white text-ink-soft hover:text-ink"
                )}
              >
                {m === "email" ? "Email" : "SMS to phone"}
              </button>
            ))}
          </div>
          <div className="mt-3">
            {props.contactMethod === "email" ? (
              <Field
                label="Email address"
                value={props.email}
                onChange={props.setEmail}
                placeholder="jane@example.com"
                type="email"
              />
            ) : (
              <Field
                label="WhatsApp number"
                value={props.phone}
                onChange={props.setPhone}
                placeholder="0803 555 0142"
                type="tel"
              />
            )}
          </div>
        </div>

        {/* The other contact field, optional, for the seller to reach them */}
        {props.contactMethod === "email" ? (
          <Field
            label="WhatsApp number (for delivery updates)"
            value={props.phone}
            onChange={props.setPhone}
            placeholder="0803 555 0142"
            type="tel"
          />
        ) : (
          <Field
            label="Email (optional, for backup)"
            value={props.email}
            onChange={props.setEmail}
            placeholder="jane@example.com"
            type="email"
          />
        )}

        <div className="grid gap-4 sm:grid-cols-[1fr,1.5fr]">
          <div className="space-y-1.5">
            <Label htmlFor="checkout-city" className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> City (State)
            </Label>
            <Select value={props.city} onValueChange={props.setCity}>
              <SelectTrigger id="checkout-city" className="h-11">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {NIGERIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Field
            label="Delivery address"
            value={props.address}
            onChange={props.setAddress}
            placeholder="House / street / area"
          />
        </div>
        
        <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 p-3">
          <p className="flex items-center gap-2 text-[11px] font-medium text-amber-800">
            <Phone className="h-3.5 w-3.5" />
            WhatsApp number is mandatory for delivery updates.
          </p>
        </div>
      </div>

      <Button
        size="lg"
        disabled={!props.valid}
        onClick={props.onSubmit}
        className="mt-6 h-12 w-full rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
      >
        Continue to payment <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </Card>
  );
}

function Instructions({
  amount,
  expiresAt,
  onConfirm,
}: {
  amount: number;
  expiresAt: string;
  onConfirm: () => void;
}) {
  const { toast } = useToast();
  const account = {
    bank: "Wema Bank",
    number: "0124 558 947",
    name: "SafeSale Escrow",
  };
  const copy = (s: string) => {
    navigator.clipboard?.writeText(s);
    toast({ title: "Copied" });
  };
  return (
    <Card title="Transfer to escrow" subtitle="Send the exact amount. Your money is held safely until you confirm delivery.">
      <div className="mt-1 rounded-xl border border-amber-200/60 bg-amber-50/70 px-4 py-3 text-amber-900">
        <p className="inline-flex items-center gap-1.5 text-xs">
          <Countdown targetIso={expiresAt} prefix="Account expires in" />
        </p>
      </div>

      <ul className="mt-4 space-y-2 text-sm">
        <PayRow label="Bank" value={account.bank} onCopy={() => copy(account.bank)} />
        <PayRow label="Account number" value={account.number} onCopy={() => copy(account.number)} highlight />
        <PayRow label="Account name" value={account.name} onCopy={() => copy(account.name)} />
        <PayRow
          label="Amount"
          value={formatNGN(amount)}
          onCopy={() => copy(String(amount))}
          highlight
        />
      </ul>

      <div className="mt-5 rounded-xl border border-emerald-200/60 bg-brand-soft/50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
          <div className="text-xs leading-relaxed text-ink-soft">
            <p className="text-sm font-medium text-ink">
              This is a SafeSale escrow account
            </p>
            <p className="mt-1">
              The seller cannot access your money. It's released only when you
              confirm delivery — or refunded if anything goes wrong.
            </p>
          </div>
        </div>
      </div>

      <Button
        size="lg"
        onClick={onConfirm}
        className="mt-5 h-12 w-full rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
      >
        I've sent the transfer
      </Button>
      <p className="mt-2 text-center text-[11px] text-ink-soft">
        We usually detect bank transfers within 60 seconds.
      </p>
    </Card>
  );
}

function PayRow({
  label,
  value,
  onCopy,
  highlight,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  highlight?: boolean;
}) {
  return (
    <li
      className={cn(
        "flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2.5",
        highlight && "bg-surface-2/30"
      )}
    >
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider text-ink-soft">
          {label}
        </p>
        <p className="text-sm font-semibold text-ink tabular-nums">{value}</p>
      </div>
      <button
        onClick={onCopy}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-brand-soft/40"
      >
        <Copy className="h-3.5 w-3.5" /> Copy
      </button>
    </li>
  );
}

function WaitingPayment({ amount, expiresAt }: { amount: number; expiresAt: string }) {
  return (
    <Card
      title="Waiting for your payment"
      subtitle="As soon as the transfer arrives, we'll lock it in escrow for your protection."
    >
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white px-6 py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
        <p className="mt-4 text-sm font-medium text-ink">Listening for your transfer…</p>
        <p className="mt-1 text-xs text-ink-soft">
          {formatNGN(amount)} expected
        </p>
        <div className="mt-4 inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-[11px] font-medium text-ink-soft">
          <Countdown targetIso={expiresAt} prefix="Auto-cancels in" />
        </div>
      </div>
    </Card>
  );
}

function Detected({ amount }: { amount: number }) {
  return (
    <Card title="Payment detected" subtitle="Verifying & moving into escrow…">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200/70 bg-brand-soft/50 px-6 py-10 text-center">
        <span className="relative inline-flex">
          <span className="absolute inset-0 rounded-full bg-brand/20 animate-lock-pulse" />
          <CheckCircle2 className="relative h-12 w-12 text-brand" />
        </span>
        <p className="mt-4 text-base font-semibold text-ink">
          {formatNGN(amount)} received
        </p>
        <p className="mt-1 text-sm text-ink-soft">Locking it in escrow now…</p>
      </div>
    </Card>
  );
}

function Secured({
  amount,
  orderToken,
  contactMethod,
  contactValue,
  onContinue,
}: {
  amount: number;
  orderToken: string;
  contactMethod: "email" | "phone";
  contactValue: string;
  onContinue: () => void;
}) {
  const { toast } = useToast();
  const orderLink = `safesale.app/order/${orderToken}`;
  return (
    <div className="space-y-4 animate-slide-up">
      <div className="rounded-2xl border border-emerald-200/60 bg-white p-6 shadow-[0_24px_60px_-30px_rgba(15,42,30,0.15)]">
        <EscrowShield
          amount={formatNGN(amount)}
          caption="Your seller has been notified and is preparing your order."
        />
      </div>

      {/* SAVE YOUR LINK — the critical bit. Without this URL the buyer has
          no way back to their escrow. Spec calls for prominent bookmark
          instruction + email/SMS delivery. */}
      <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-5">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Bookmark className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">
              Save your order link
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              This is your only way back to this order — you don't have an
              account. We've also sent it to your{" "}
              <span className="font-medium text-ink">
                {contactMethod === "email" ? "email" : "phone via SMS"}
              </span>
              {contactValue && (
                <>
                  {" "}(<span className="font-medium text-ink">{contactValue}</span>)
                </>
              )}
              .
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-stretch rounded-lg border border-amber-200 bg-white">
          <div className="flex flex-1 items-center gap-2 truncate px-3 font-mono text-xs text-ink">
            <LinkIcon className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
            <span className="truncate">{orderLink}</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(orderLink);
              toast({ title: "Order link copied" });
            }}
            className="inline-flex items-center gap-1 border-l border-amber-200 px-3 text-xs font-medium text-amber-800 hover:bg-amber-100/60"
          >
            <Copy className="h-3.5 w-3.5" /> Copy
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <SaveAction icon={Mail} label={`${contactMethod === "email" ? "Email" : "SMS"} sent`} done />
          <SaveAction icon={Bookmark} label="Bookmark this page" />
          <SaveAction icon={ImageDown} label="Screenshot it" />
        </div>
      </div>

      {/* What happens next */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="text-sm font-semibold text-ink">What happens next?</p>
        <ol className="mt-3 space-y-2 text-sm text-ink-soft">
          <li className="flex items-start gap-2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>Money is held safely — seller can't touch it yet.</span>
          </li>
          <li className="flex items-start gap-2">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>Seller ships your order with a tracking number.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>You confirm delivery — seller gets paid in seconds.</span>
          </li>
        </ol>
      </div>

      <Button
        onClick={onContinue}
        size="lg"
        className="h-12 w-full rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
      >
        Open my order page <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

function SaveAction({
  icon: Icon,
  label,
  done,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  done?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border bg-white px-2 py-2 text-center",
        done ? "border-emerald-200 bg-brand-soft/40" : "border-amber-200"
      )}
    >
      <Icon className={cn("h-4 w-4", done ? "text-brand" : "text-amber-700")} />
      <span className={cn("text-[10px] font-medium", done ? "text-brand-soft-foreground" : "text-ink")}>
        {label}
      </span>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_-16px_rgba(15,42,30,0.12)] animate-slide-up">
      <h2 className="text-base font-semibold tracking-tight text-ink sm:text-lg">
        {title}
      </h2>
      {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="mt-1.5 h-11"
      />
    </div>
  );
}

function Row({ k, v, sub }: { k: string; v: string; sub?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-3",
        sub && "text-xs text-ink-soft"
      )}
    >
      <span className={sub ? "text-xs text-ink-soft" : "text-sm text-ink-soft"}>{k}</span>
      <span className={cn("tabular-nums", sub ? "text-xs text-ink-soft" : "text-sm font-medium text-ink")}>
        {v}
      </span>
    </div>
  );
}

function Footnote() {
  return (
    <p className="px-1 text-[11px] leading-relaxed text-ink-soft">
      Need help? Message{" "}
      <a href="#" className="text-brand hover:underline">
        SafeSale support
      </a>{" "}
      any time. Our team responds within minutes.
    </p>
  );
}


