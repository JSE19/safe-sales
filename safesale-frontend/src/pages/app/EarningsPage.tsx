import { useSeoMeta } from "@unhead/react";
import { useState } from "react";
import { AppShell } from "@/components/safesale/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { earnings, payouts } from "@/lib/mock";
import { formatDate, formatNGN, formatSats } from "@/lib/format";
import {
  Banknote,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building2,
  ArrowDownCircle,
  Pencil,
  Zap,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function EarningsPage() {
  useSeoMeta({ title: "Earnings — SafeSale" });
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [bankEditOpen, setBankEditOpen] = useState(false);
  
  // Local state for bank details (in a real app this would be synced with a backend/Nostr)
  const [bankDetails, setBankDetails] = useState({
    bankName: "Guaranty Trust Bank",
    accountName: "Amaka Okafor",
    accountNumber: "0123456789"
  });

  const handleWithdraw = () => {
    setIsWithdrawing(true);
    // Simulate API call
    setTimeout(() => {
      setIsWithdrawing(false);
      setWithdrawSuccess(true);
      setTimeout(() => {
        setWithdrawSuccess(false);
        setWithdrawOpen(false);
      }, 2000);
    }, 1500);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    setBankEditOpen(false);
    // Toast would be here
  };

  return (
    <AppShell title="Earnings" subtitle="Money in, money out — all in one place.">
      <div className="space-y-5">
        {/* Balance hero */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_-16px_rgba(15,42,30,0.12)]">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">
            Available to withdraw
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {formatNGN(earnings.availableNGN)}
          </p>
          <Button
            onClick={() => setWithdrawOpen(true)}
            size="lg"
            className="mt-4 h-12 w-full rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
          >
            <ArrowDownCircle className="mr-2 h-4 w-4" /> Withdraw to bank
          </Button>

          <div className="mt-5 grid grid-cols-2 divide-x divide-border rounded-xl border border-border">
            <Balance
              icon={ShieldCheck}
              label="In escrow"
              value={formatNGN(earnings.pendingNGN)}
              sub="across 5 active orders"
            />
            <Balance
              icon={Zap}
              label="Sats balance"
              value={formatSats(earnings.satsBalance)}
              sub={`≈ ${formatNGN(earnings.satsBalance * 0.9)}`}
              tone="gold"
            />
          </div>
        </div>

        {/* Connected bank */}
        <Section title="Payout method" action={
          <button 
            onClick={() => setBankEditOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        }>
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand-soft-foreground">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">
                {bankDetails.bankName}
              </p>
              <p className="text-xs text-ink-soft">
                {bankDetails.accountName} · **** {bankDetails.accountNumber.slice(-4)}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand-soft-foreground">
              <CheckCircle2 className="h-3 w-3" /> Verified
            </span>
          </div>
        </Section>

        {/* Trend */}
        <Section title="This month" subtitle="Confirmed earnings">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-semibold tracking-tight text-ink">
                {formatNGN(earnings.thisMonthNGN)}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" /> +28% vs last month
              </p>
            </div>
            <MiniBars data={earnings.weekly} />
          </div>
        </Section>

        {/* Payout history */}
        <Section title="Payout history">
          <ul className="divide-y divide-border">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-full",
                    p.status === "completed"
                      ? "bg-brand-soft text-brand-soft-foreground"
                      : p.status === "processing"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                  )}
                >
                  {p.status === "completed" ? (
                    <Banknote className="h-4 w-4" />
                  ) : p.status === "processing" ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <Clock className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">
                    {formatNGN(p.amountNGN)}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {p.bankRef} · {formatDate(p.at)}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                    p.status === "completed" && "bg-brand-soft text-brand-soft-foreground",
                    p.status === "processing" && "bg-amber-100 text-amber-800",
                    p.status === "scheduled" && "bg-slate-100 text-slate-700"
                  )}
                >
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw to bank</DialogTitle>
            <DialogDescription>
              Funds land in your GTB account within 60 seconds.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!withdrawSuccess ? (
              <>
                <div>
                  <Label htmlFor="amt">Amount</Label>
                  <div className="relative mt-1.5">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-soft">
                      ₦
                    </span>
                    <Input
                      id="amt"
                      defaultValue={earnings.availableNGN.toLocaleString("en-NG")}
                      className="h-12 pl-7 text-lg"
                    />
                  </div>
                  <p className="mt-2 text-xs text-ink-soft">
                    Available: {formatNGN(earnings.availableNGN)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2/40 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-ink-soft" />
                    <span className="font-medium text-ink">
                      {bankDetails.bankName.split(' ')[0]} ****{bankDetails.accountNumber.slice(-4)}
                    </span>
                    <span className="text-ink-soft">· {bankDetails.accountName}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <p className="text-base font-semibold text-ink">Withdrawal Scheduled</p>
                <p className="mt-1 text-sm text-ink-soft">
                  ₦{earnings.availableNGN.toLocaleString()} is on its way to your bank account.
                </p>
              </div>
            )}
          </div>
          {!withdrawSuccess && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setWithdrawOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="bg-brand text-brand-foreground hover:bg-brand/90"
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm withdrawal"
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Bank Dialog */}
      <Dialog open={bankEditOpen} onOpenChange={setBankEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit payout method</DialogTitle>
            <DialogDescription>
              Update the bank account where you receive your money.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveBank} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-bank">Bank Name</Label>
              <Select 
                value={bankDetails.bankName} 
                onValueChange={(v) => setBankDetails(prev => ({ ...prev, bankName: v }))}
              >
                <SelectTrigger id="edit-bank" className="h-11">
                  <SelectValue placeholder="Select bank" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Access Bank", "GTBank", "Zenith Bank", "First Bank", "UBA", 
                    "Opay", "Kuda Bank", "Moniepoint", "Wema Bank"
                  ].map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-acct">Account Number</Label>
              <Input
                id="edit-acct"
                value={bankDetails.accountNumber}
                onChange={(e) => setBankDetails(prev => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="0123456789"
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Account Name</Label>
              <Input
                id="edit-name"
                value={bankDetails.accountName}
                onChange={(e) => setBankDetails(prev => ({ ...prev, accountName: e.target.value }))}
                placeholder="Full Name"
                className="h-11"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setBankEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-brand text-brand-foreground hover:bg-brand/90">
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Balance({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone?: "gold";
}) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-full",
            tone === "gold" ? "bg-gold-soft text-amber-700" : "bg-brand-soft text-brand-soft-foreground"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="text-xs font-medium uppercase tracking-wider text-ink-soft">
          {label}
        </p>
      </div>
      <p className="mt-2 text-base font-semibold text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] text-ink-soft">{sub}</p>
    </div>
  );
}

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_8px_24px_-16px_rgba(15,42,30,0.12)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function _EditButton() {
  return (
    <button className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
      <Pencil className="h-3 w-3" /> Edit
    </button>
  );
}

function MiniBars({ data }: { data: { day: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex h-14 items-end gap-1.5">
      {data.map((d) => (
        <div
          key={d.day}
          className="w-2 rounded-sm bg-brand/30"
          style={{ height: `${(d.value / max) * 100}%` }}
        />
      ))}
    </div>
  );
}
