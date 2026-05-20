import { useSeoMeta } from "@unhead/react";
import { useEffect, useState } from "react";
import { NIGERIAN_STATES, NIGERIAN_BANKS } from "@/lib/nigeria";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { Logo, LogoMark } from "@/components/safesale/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/safesale/Avatar";
import { checkHandle, suggestHandle, type HandleCheck } from "@/lib/mock";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Store,
  Phone,
  Loader2,
  AlertCircle,
  MapPin,
  Building2,
} from "lucide-react";

type Step = 0 | 1 | 2 | 3 | 4 | 5;

export default function Onboarding() {
  useSeoMeta({ title: "Get started — SafeSale" });
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [city, setCity] = useState("Lagos");
  const [category, setCategory] = useState("Fashion & Thrift");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");

  // Payout details — required so we know where to send completed-order funds.
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");

  const navigate = useNavigate();

  const next = () => setStep((s) => Math.min(5, s + 1) as Step);
  const back = () => setStep((s) => Math.max(0, s - 1) as Step);

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <Link to="/app" className="text-xs font-medium text-ink-soft hover:text-ink">
            Skip for now
          </Link>
        </div>
        <Progress step={step} />
      </header>

      <main className="container max-w-lg py-8 sm:py-12">
        {step === 0 && <Welcome onNext={next} />}
        {step === 1 && (
          <CreateIdentity
            name={name}
            setName={setName}
            handle={handle}
            setHandle={setHandle}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 2 && (
          <DisplayInfo
            city={city}
            setCity={setCity}
            category={category}
            setCategory={setCategory}
            phone={phone}
            setPhone={setPhone}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 3 && (
          <PayoutSetup
            bankName={bankName}
            setBankName={setBankName}
            accountNumber={bankAccountNumber}
            setAccountNumber={setBankAccountNumber}
            accountName={bankAccountName}
            setAccountName={setBankAccountName}
            sellerName={name || "Your Name"}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 4 && (
          <ProfileSetup
            name={name || "Your Name"}
            handle={handle || "yourhandle"}
            bio={bio}
            setBio={setBio}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 5 && (
          <Success
            name={name || "Your Name"}
            onContinue={() => navigate("/app")}
          />
        )}
      </main>
    </div>
  );
}

function Progress({ step }: { step: Step }) {
  const pct = ((step + 1) / 6) * 100;
  return (
    <div className="h-1 w-full bg-secondary">
      <div
        className="h-full bg-brand transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="animate-slide-up text-center">
      <div className="relative mx-auto inline-flex">
        <span className="absolute inset-0 rounded-full bg-brand/15 animate-lock-pulse" />
        <LogoMark className="relative h-14 w-14 rounded-xl" />
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Welcome to SafeSale
      </h1>
      <p className="mx-auto mt-3 max-w-md text-base text-ink-soft">
        In two minutes, you'll have a verified seller profile, your first
        listing link, and full escrow protection on every order.
      </p>

      <ul className="mx-auto mt-8 max-w-sm space-y-3 text-left">
        {[
          "No setup fees, no monthly fees",
          "Payouts to your Nigerian bank account",
          "Reputation that travels with you",
          "Built-in dispute mediation",
        ].map((t) => (
          <li
            key={t}
            className="flex items-start gap-3 rounded-xl border border-border bg-white px-4 py-3"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <span className="text-sm text-ink">{t}</span>
          </li>
        ))}
      </ul>

      <Button
        size="lg"
        onClick={onNext}
        className="mt-8 h-12 w-full rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
      >
        Get started <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
      <p className="mt-4 text-xs text-ink-soft">
        Already have an account?{" "}
        <Link to="/app" className="font-medium text-brand">
          Sign in
        </Link>
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function CreateIdentity({
  name,
  setName,
  handle,
  setHandle,
  onNext,
  onBack,
}: {
  name: string;
  setName: (v: string) => void;
  handle: string;
  setHandle: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  // Auto-suggest a handle from the display name (only while user hasn't
  // typed their own handle yet).
  const [handleTouched, setHandleTouched] = useState(false);
  useEffect(() => {
    if (handleTouched) return;
    const s = suggestHandle(name);
    if (s) setHandle(s);
  }, [name, handleTouched, setHandle]);

  // Debounced availability check.
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<HandleCheck | null>(null);
  useEffect(() => {
    if (handle.length < 3) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCheck(null);
      return;
    }
    setChecking(true);
    const t = setTimeout(() => {
      setCheck(checkHandle(handle));
      setChecking(false);
    }, 450);
    return () => clearTimeout(t);
  }, [handle]);

  const valid = name.trim().length >= 2 && check?.ok === true;

  return (
    <Card title="Your shop, your name" subtitle="This is what buyers will see.">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Display name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Amaka Okafor"
            className="mt-1.5 h-11"
            autoFocus
          />
          <p className="mt-1.5 text-xs text-ink-soft">
            Your real name or business name — whichever buyers know you by.
          </p>
        </div>

        <div>
          <Label htmlFor="handle">SafeSale handle</Label>
          <div
            className={cn(
              "mt-1.5 flex h-11 items-stretch rounded-md border bg-white shadow-sm transition-colors focus-within:ring-2 focus-within:ring-ring/50",
              check?.ok === false ? "border-rose-300 focus-within:ring-rose-300/40" : "border-input"
            )}
          >
            <span className="inline-flex items-center border-r border-inherit px-3 text-sm text-ink-soft">
              safesale.to/
            </span>
            <Input
              id="handle"
              value={handle}
              onChange={(e) => {
                setHandleTouched(true);
                setHandle(
                  e.target.value
                    .replace(/[^a-z0-9._-]/gi, "")
                    .toLowerCase()
                );
              }}
              placeholder="amaka.thrift"
              className="h-full border-0 px-3 shadow-none focus-visible:ring-0"
              aria-invalid={check?.ok === false}
              aria-describedby="handle-status"
            />
            <span className="inline-flex items-center px-3">
              {checking && (
                <Loader2 className="h-4 w-4 animate-spin text-ink-soft" />
              )}
              {!checking && check?.ok === true && (
                <CheckCircle2 className="h-4 w-4 text-brand" />
              )}
              {!checking && check?.ok === false && (
                <AlertCircle className="h-4 w-4 text-rose-500" />
              )}
            </span>
          </div>

          {/* Status line */}
          <div id="handle-status" className="mt-1.5 min-h-[1.25rem] text-xs">
            {!handle && (
              <span className="text-ink-soft">
                3–24 letters, numbers, dots or dashes.
              </span>
            )}
            {checking && handle && (
              <span className="text-ink-soft">Checking availability…</span>
            )}
            {!checking && check?.ok === true && (
              <span className="font-medium text-brand">
                Available — your shop will live at{" "}
                <span className="font-semibold text-ink">safesale.to/{handle}</span>
              </span>
            )}
            {!checking && check?.ok === false && (
              <HandleError check={check} onPick={(h) => { setHandle(h); setHandleTouched(true); }} />
            )}
          </div>

          {/* Live URL preview */}
          {check?.ok === true && (
            <div className="mt-3 rounded-xl border border-emerald-200/60 bg-brand-soft/40 px-3.5 py-3 animate-slide-up">
              <p className="text-[10px] font-medium uppercase tracking-wider text-brand-soft-foreground">
                Your storefront link
              </p>
              <p className="mt-1 font-mono text-sm font-medium text-ink">
                safesale.to/<span className="text-brand">{handle}</span>
              </p>
              <p className="mt-1 text-[11px] text-ink-soft">
                Goes in your Instagram bio, WhatsApp About, TikTok profile —
                anywhere you currently share a Linktree.
              </p>
            </div>
          )}
        </div>
      </div>

      <NavRow onBack={onBack} onNext={onNext} nextDisabled={!valid} />
    </Card>
  );
}

function HandleError({
  check,
  onPick,
}: {
  check: Extract<HandleCheck, { ok: false }>;
  onPick: (handle: string) => void;
}) {
  const messages: Record<typeof check.reason, string> = {
    "too-short": "Needs at least 3 characters.",
    "too-long": "Maximum 24 characters.",
    "invalid-chars": "Only letters, numbers, dots and dashes — and can't start or end with one.",
    "reserved": "That word is reserved by SafeSale.",
    "taken": "That handle is already taken.",
  };
  return (
    <div className="space-y-1.5">
      <span className="font-medium text-rose-700">{messages[check.reason]}</span>
      {check.suggestions && check.suggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-ink-soft">Try:</span>
          {check.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              className="rounded-full border border-border bg-white px-2 py-0.5 font-medium text-ink hover:border-brand/40 hover:bg-brand-soft/40 hover:text-brand"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function DisplayInfo({
  city,
  setCity,
  category,
  setCategory,
  phone,
  setPhone,
  onNext,
  onBack,
}: {
  city: string;
  setCity: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const valid = city.length > 0 && category.trim().length > 10 && phone.trim().length > 5;

  return (
    <Card title="Business details" subtitle="Help buyers find and trust your shop.">
      <div className="space-y-5">
        <div>
          <Label htmlFor="city">Where you sell from (State)</Label>
          <div className="mt-1.5">
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger id="city" className="w-full h-11 bg-white">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-ink-soft" />
                  <SelectValue placeholder="Select your state" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {NIGERIAN_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="category">What do you sell?</Label>
          <div className="mt-1.5">
            <Textarea
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. I sell high-quality thrifted denim jackets and vintage shirts for men and women..."
              className="min-h-[100px] bg-white text-sm"
            />
            <p className="mt-1.5 text-[11px] text-ink-soft">
              Describe your products. Needs at least 10 characters.
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="phone">WhatsApp number (Mandatory)</Label>
          <div className="relative mt-1.5">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 803 ..."
              className="h-11 pl-9 bg-white"
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-soft">
            Buyers will use this to message you about orders.
          </p>
        </div>
      </div>
      <NavRow onBack={onBack} onNext={onNext} nextDisabled={!valid} />
    </Card>
  );
}

/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */

function PayoutSetup({
  bankName,
  setBankName,
  accountNumber,
  setAccountNumber,
  accountName,
  setAccountName,
  sellerName,
  onNext,
  onBack,
}: {
  bankName: string;
  setBankName: (v: string) => void;
  accountNumber: string;
  setAccountNumber: (v: string) => void;
  accountName: string;
  setAccountName: (v: string) => void;
  sellerName: string;
  onNext: () => void;
  onBack: () => void;
}) {
  const accountNumberValid = /^\d{10}$/.test(accountNumber);
  const valid =
    bankName.trim().length > 1 &&
    accountNumberValid &&
    accountName.trim().length > 2;

  return (
    <Card
      title="Where should we pay you?"
      subtitle="Completed orders are paid out here, instantly. You can change this any time."
    >
      <div className="space-y-5">
        <div>
          <Label htmlFor="bank">Bank</Label>
          <div className="mt-1.5">
            <Select value={bankName} onValueChange={setBankName}>
              <SelectTrigger id="bank" className="w-full h-11 bg-white">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-ink-soft" />
                  <SelectValue placeholder="Select your bank" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {NIGERIAN_BANKS.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="acct-number">Account number</Label>
          <Input
            id="acct-number"
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) =>
              setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="0123456789"
            className="mt-1.5 h-11 font-mono tracking-wider"
          />
          <p className="mt-1.5 text-xs text-ink-soft">
            10 digits — exactly as it appears on your bank statement.
            {accountNumber && !accountNumberValid && (
              <span className="ml-1 font-medium text-rose-700">
                Needs to be 10 digits.
              </span>
            )}
          </p>
        </div>

        <div>
          <Label htmlFor="acct-name">Account name</Label>
          <Input
            id="acct-name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder={sellerName}
            className="mt-1.5 h-11"
          />
          <p className="mt-1.5 text-xs text-ink-soft">
            Must match the name registered with your bank.
          </p>
        </div>

        {/* Reassurance */}
        <div className="rounded-xl border border-emerald-200/70 bg-brand-soft/60 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div className="text-xs leading-relaxed text-ink-soft">
              <p className="text-sm font-medium text-ink">
                Your account is encrypted at rest
              </p>
              <p className="mt-1">
                We only use it to send payouts when a buyer releases an order.
                Nobody — not buyers, not other sellers, not SafeSale staff —
                can see this number.
              </p>
            </div>
          </div>
        </div>
      </div>

      <NavRow onBack={onBack} onNext={onNext} nextDisabled={!valid} />
    </Card>
  );
}

/* -------------------------------------------------------------------------- */

function ProfileSetup({
  name,
  handle,
  bio,
  setBio,
  onNext,
  onBack,
}: {
  name: string;
  handle: string;
  bio: string;
  setBio: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const handleNext = async () => {
    setSubmitting(true);
    // Simulate silent identity creation
    await new Promise((r) => setTimeout(r, 1100));
    onNext();
  };

  return (
    <Card
      title="Polish your storefront"
      subtitle="A short bio helps buyers feel comfortable."
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4 rounded-xl border border-border bg-surface-2/40 p-4">
          <Avatar seed={handle || name} name={name} size={56} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink">{name}</p>
            <p className="truncate text-sm text-ink-soft">@{handle}</p>
          </div>
          <button className="rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-secondary">
            Change photo
          </button>
        </div>

        <div>
          <Label htmlFor="bio">About your shop</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="e.g. Curated thrift fashion, hand-picked & hand-cleaned. Lagos same-day delivery."
            className="mt-1.5 min-h-[110px]"
          />
          <p className="mt-1.5 text-xs text-ink-soft">
            2–3 sentences works best. {bio.length}/180
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200/70 bg-brand-soft/60 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
            <div>
              <p className="text-sm font-medium text-ink">
                Your seller identity is being secured
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                We're creating a cryptographic key that proves your reviews and
                orders are really yours — and only yours.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-11 flex-1 rounded-lg"
          disabled={submitting}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={submitting}
          className="h-11 flex-[2] rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating profile…
            </>
          ) : (
            <>
              Finish setup <ArrowRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */

function Success({ name, onContinue }: { name: string; onContinue: () => void }) {
  return (
    <div className="animate-slide-up text-center">
      <div className="relative mx-auto inline-flex">
        <span className="absolute inset-0 rounded-full bg-brand/20 animate-lock-pulse" />
        <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-[0_12px_30px_-10px_color-mix(in_oklab,var(--brand)_60%,transparent)]">
          <CheckCircle2 className="h-8 w-8" />
        </span>
      </div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        You're all set, {name.split(" ")[0]}!
      </h1>
      <p className="mx-auto mt-3 max-w-md text-base text-ink-soft">
        Your verified SafeSale shop is live. Time to add your first product and
        share the link.
      </p>

      <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-4">
          <Store className="h-5 w-5 text-brand" />
          <p className="mt-3 text-sm font-semibold text-ink">
            Create your first listing
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Upload photos, set a price, get a shareable link in seconds.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <Sparkles className="h-5 w-5 text-brand" />
          <p className="mt-3 text-sm font-semibold text-ink">
            Add to your Instagram bio
          </p>
          <p className="mt-1 text-xs text-ink-soft">
            Replace your linktree with your SafeSale storefront.
          </p>
        </div>
      </div>

      <Button
        size="lg"
        onClick={onContinue}
        className="mt-8 h-12 w-full rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
      >
        Open my dashboard <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

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
    <div className="animate-slide-up rounded-2xl border border-border bg-white p-6 shadow-[0_24px_60px_-30px_rgba(15,42,30,0.15)] sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        {title}
      </h2>
      {subtitle && <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function NavRow({
  onBack,
  onNext,
  nextDisabled,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
}) {
  return (
    <div className="mt-6 flex gap-3">
      <Button
        variant="outline"
        onClick={onBack}
        className="h-11 flex-1 rounded-lg"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <Button
        onClick={onNext}
        disabled={nextDisabled}
        className="h-11 flex-[2] rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
      >
        Continue <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}
