import { useSeoMeta } from "@unhead/react";
import { useState } from "react";
import { AppShell } from "@/components/safesale/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QRCodeCanvas } from "@/components/ui/qrcode";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Countdown } from "@/components/safesale/Countdown";
import { paymentRequests, currentSeller } from "@/lib/mock";
import { formatNGN, formatRelative } from "@/lib/format";
import { useToast } from "@/hooks/useToast";
import {
  Plus,
  Copy,
  Link as LinkIcon,
  Check,
  CircleDashed,
  CheckCircle2,
  Clock,
  Ban,
  Share2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentRequest } from "@/lib/types";

export default function PaymentRequestsPage() {
  useSeoMeta({ title: "Payment requests — SafeSale" });
  const [open, setOpen] = useState(false);

  const pending = paymentRequests.filter((p) => p.status === "pending");
  const others = paymentRequests.filter((p) => p.status !== "pending");

  return (
    <AppShell
      title="Payment requests"
      subtitle="One-tap pay links for negotiated orders."
      action={
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-soft">
            {pending.length} pending ·{" "}
            {paymentRequests.filter((p) => p.status === "paid").length} paid
            this week
          </p>
          <Button
            onClick={() => setOpen(true)}
            size="sm"
            className="h-8 rounded-md bg-brand text-xs text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> New request
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Explainer (only when there are no pending) */}
        {pending.length === 0 && (
          <EmptyExplainer onCreate={() => setOpen(true)} />
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <section>
            <SectionHeader title="Awaiting payment" count={pending.length} />
            <ul className="space-y-3">
              {pending.map((p) => (
                <RequestCard key={p.id} pr={p} highlight />
              ))}
            </ul>
          </section>
        )}

        {/* History */}
        {others.length > 0 && (
          <section>
            <SectionHeader title="History" count={others.length} />
            <ul className="space-y-3">
              {others.map((p) => (
                <RequestCard key={p.id} pr={p} />
              ))}
            </ul>
          </section>
        )}
      </div>

      <CreateRequestSheet open={open} onClose={() => setOpen(false)} />
    </AppShell>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <span className="text-[11px] text-ink-soft">{count}</span>
    </div>
  );
}

function EmptyExplainer({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-brand-soft via-white to-white p-6">
      <Sparkles className="h-6 w-6 text-brand" />
      <p className="mt-3 text-base font-semibold text-ink">
        Get paid safely for negotiated orders
      </p>
      <p className="mt-1 max-w-md text-sm text-ink-soft">
        When a buyer DMs about a custom price, just generate a one-tap pay
        link. They pay into escrow, you ship, you get paid — same as a
        listing, but for off-menu orders.
      </p>
      <Button
        onClick={onCreate}
        size="lg"
        className="mt-4 h-11 rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
      >
        Create your first request <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

function RequestCard({ pr, highlight }: { pr: PaymentRequest; highlight?: boolean }) {
  const { toast } = useToast();
  const link = `safesale.to/pay/${pr.code}`;
  const copy = () => {
    navigator.clipboard?.writeText(link);
    toast({ title: "Pay link copied" });
  };

  return (
    <li
      className={cn(
        "overflow-hidden rounded-2xl border bg-white p-4 transition-all",
        highlight
          ? "border-emerald-200/70 shadow-[0_8px_24px_-16px_rgba(15,42,30,0.15)]"
          : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-ink">
              {pr.description}
            </p>
          </div>
          {pr.buyerNote && (
            <p className="mt-0.5 text-xs text-ink-soft">
              Note: {pr.buyerNote}
            </p>
          )}
          <p className="mt-1 text-[11px] text-ink-soft">
            Created {formatRelative(pr.createdAt)}
            {pr.paidBy && ` · paid by ${pr.paidBy}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-base font-semibold tabular-nums text-ink">
            {formatNGN(pr.amountNGN)}
          </p>
          <StatusPill status={pr.status} />
        </div>
      </div>

      {pr.status === "pending" && (
        <div className="mt-3 space-y-2 border-t border-border pt-3">
          <div className="flex items-stretch rounded-lg border border-border bg-surface-2/30">
            <div className="flex flex-1 items-center gap-2 truncate px-3 font-mono text-xs text-ink">
              <LinkIcon className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
              <span className="truncate">{link}</span>
            </div>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1 border-l border-border px-3 text-xs font-medium text-brand hover:bg-brand-soft/40"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            <button
              onClick={() => toast({ title: "Share sheet opened" })}
              className="inline-flex items-center gap-1 border-l border-border px-3 text-xs font-medium text-brand hover:bg-brand-soft/40"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-ink-soft">
            <Countdown targetIso={pr.expiresAt} prefix="Expires in" />
            <button className="font-medium text-rose-700 hover:underline">
              Cancel request
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function StatusPill({ status }: { status: PaymentRequest["status"] }) {
  const map = {
    pending: { label: "Awaiting payment", bg: "bg-amber-50", text: "text-amber-800", ring: "ring-amber-200", Icon: CircleDashed },
    paid: { label: "Paid", bg: "bg-brand-soft", text: "text-brand-soft-foreground", ring: "ring-emerald-200", Icon: CheckCircle2 },
    expired: { label: "Expired", bg: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-200", Icon: Clock },
    cancelled: { label: "Cancelled", bg: "bg-rose-50", text: "text-rose-800", ring: "ring-rose-200", Icon: Ban },
  } as const;
  const s = map[status];
  const { Icon } = s;
  return (
    <span
      className={cn(
        "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
        s.bg,
        s.text,
        s.ring
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {s.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Create sheet                                                               */
/* -------------------------------------------------------------------------- */

function CreateRequestSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [buyerNote, setBuyerNote] = useState("");
  const [expiry, setExpiry] = useState<"24h" | "48h" | "7d">("24h");
  const [step, setStep] = useState<"form" | "share">("form");

  const { toast } = useToast();

  // Stable code per open session so the QR/link don't jump while the user reads.
  const [generatedCode] = useState(() => generateCode());
  const link = `safesale.to/pay/${generatedCode}`;

  const reset = () => {
    setAmount("");
    setDescription("");
    setBuyerNote("");
    setExpiry("24h");
    setStep("form");
  };

  const valid = Number(amount) > 0 && description.trim().length > 2;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setTimeout(reset, 200);
        }
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-0 sm:mx-auto sm:left-1/2 sm:right-auto sm:max-w-lg sm:-translate-x-1/2"
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border sm:hidden" />
        <SheetHeader className="px-5 pt-4">
          <SheetTitle className="text-left text-lg">
            {step === "form" ? "Create payment request" : "Link is ready ✨"}
          </SheetTitle>
          <SheetDescription className="text-left">
            {step === "form"
              ? "Name the amount you agreed on. We'll generate a safe pay link."
              : "Send this link to your buyer. They'll pay into escrow."}
          </SheetDescription>
        </SheetHeader>

        <div className="max-h-[78vh] overflow-y-auto px-5 py-4 pb-8">
          {step === "form" && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="amt">Amount</Label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg font-medium text-ink-soft">
                    ₦
                  </span>
                  <Input
                    id="amt"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="35,000"
                    className="h-14 pl-8 text-xl font-semibold"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="desc">What's it for?</Label>
                <Input
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Silk wrap dress (UK 10, emerald)"
                  className="mt-1.5 h-11"
                />
                <p className="mt-1.5 text-xs text-ink-soft">
                  Shown to the buyer at checkout so they know what they're
                  paying for.
                </p>
              </div>

              <div>
                <Label htmlFor="note">Note (only you see this)</Label>
                <Textarea
                  id="note"
                  value={buyerNote}
                  onChange={(e) => setBuyerNote(e.target.value)}
                  placeholder="e.g. For Funke from IG"
                  className="mt-1.5 min-h-[64px]"
                />
              </div>

              <div>
                <Label>Expires in</Label>
                <div className="mt-1.5 grid grid-cols-3 gap-2">
                  {(["24h", "48h", "7d"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setExpiry(opt)}
                      className={cn(
                        "rounded-md border px-3 py-2.5 text-sm font-medium transition-colors",
                        expiry === opt
                          ? "border-brand bg-brand-soft text-brand-soft-foreground"
                          : "border-border bg-white text-ink-soft hover:text-ink"
                      )}
                    >
                      {opt === "24h" ? "24 hours" : opt === "48h" ? "48 hours" : "7 days"}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                disabled={!valid}
                onClick={() => setStep("share")}
                size="lg"
                className="h-12 w-full rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
              >
                Generate pay link
              </Button>
            </div>
          )}

          {step === "share" && (
            <div className="space-y-5">
              {/* Receipt-style summary */}
              <div className="rounded-2xl border border-border bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">
                  Buyer pays
                </p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">
                  ₦{Number(amount).toLocaleString("en-NG")}
                </p>
                <p className="mt-1 text-sm text-ink">{description}</p>
                <p className="mt-2 text-xs text-ink-soft">
                  To: {currentSeller.name} (@{currentSeller.handle})
                </p>
              </div>

              {/* Share link */}
              <div>
                <Label>Pay link</Label>
                <div className="mt-1.5 flex items-stretch rounded-lg border border-border bg-white">
                  <div className="flex flex-1 items-center gap-2 px-3 font-mono text-sm text-ink">
                    <LinkIcon className="h-4 w-4 shrink-0 text-ink-soft" />
                    <span className="truncate">{link}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(link);
                      toast({ title: "Pay link copied" });
                    }}
                    className="inline-flex items-center gap-1 border-l border-border px-3 text-sm font-medium text-brand hover:bg-brand-soft/40"
                  >
                    <Copy className="h-4 w-4" /> Copy
                  </button>
                </div>
              </div>

              {/* QR card */}
              <div className="rounded-2xl border border-border bg-surface-2/30 p-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-white p-2">
                    <QRCodeCanvas
                      value={`https://${link}`}
                      size={96}
                      className="h-24 w-24"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">QR fallback</p>
                    <p className="mt-1 text-xs text-ink-soft">
                      Drop the QR into a story, on packaging, or share via
                      WhatsApp status when typing is slow.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-emerald-200/60 bg-brand-soft/40 px-3 py-2.5 text-xs text-brand-soft-foreground">
                <Check className="h-3.5 w-3.5" />
                Expires in{" "}
                <span className="font-medium">
                  {expiry === "24h" ? "24 hours" : expiry === "48h" ? "48 hours" : "7 days"}
                </span>
                . You'll be notified the moment it's paid.
              </div>

              <Button
                onClick={onClose}
                size="lg"
                className="h-12 w-full rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
              >
                <Check className="mr-2 h-4 w-4" /> Done
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no easily-confused chars
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}
