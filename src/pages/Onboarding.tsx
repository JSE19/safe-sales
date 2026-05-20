/**
 * Seller Onboarding — single screen.
 *
 * Replaces the previous 6-step wizard. A new seller gets in by either:
 *   1. Generating a fresh Nostr keypair in the browser (one click), or
 *   2. Connecting an existing key via extension, nsec paste, or NIP-46
 *      remote signer.
 *
 * In both paths the seller picks a handle + shop name, then lands on
 * `/app`. Bank details, photo, bio, and category are deferred to inline
 * prompts when the seller actually needs them — not collected upfront.
 *
 * Design ported from a Stitch prototype; reworked to use SafeSale's
 * existing color tokens (`bg-surface`, `bg-brand`, `text-ink`),
 * lucide-react icons, and shadcn/ui primitives.
 */

import { useSeoMeta } from "@unhead/react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { generateSecretKey, nip19 } from "nostr-tools";
import {
  Check,
  Cloud,
  Key,
  Loader2,
  Lock,
  Puzzle,
  X,
} from "lucide-react";

import { Logo } from "@/components/safesale/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLoginActions } from "@/hooks/useLoginActions";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

type ConnectMethod = "extension" | "nsec" | "bunker";

const HANDLE_MIN = 3;
const SHOP_NAME_MIN = 2;

export default function Onboarding() {
  useSeoMeta({ title: "Open your shop — SafeSale" });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-4 antialiased">
      <Link to="/" className="mb-8 inline-block">
        <Logo />
      </Link>

      <OnboardingCard />

      <NostrInfoFooter />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function OnboardingCard() {
  return (
    <main className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-white p-6 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.06),0_4px_6px_-4px_rgba(0,0,0,0.05)] sm:p-8">
      <header className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Open your shop in 30 seconds.
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Your shop is owned by your Nostr key. No email, no password, no
          bank account needed yet.
        </p>
      </header>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="mb-8 grid w-full grid-cols-2 bg-surface">
          <TabsTrigger value="create">Create a new key</TabsTrigger>
          <TabsTrigger value="import">I already have one</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-0">
          <CreateKeyForm />
        </TabsContent>

        <TabsContent value="import" className="mt-0">
          <ImportKeyForm />
        </TabsContent>
      </Tabs>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Tab 1 — Create a new key                          */
/* -------------------------------------------------------------------------- */

function CreateKeyForm() {
  const [handle, setHandle] = useState("");
  const [shopName, setShopName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const loginActions = useLoginActions();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleValid = isHandleValid(handle);
  const shopNameValid = shopName.trim().length >= SHOP_NAME_MIN;
  const canSubmit = handleValid && shopNameValid && !isCreating;

  const submit = async () => {
    if (!canSubmit) return;
    setIsCreating(true);
    try {
      const sk = generateSecretKey();
      const nsec = nip19.nsecEncode(sk);
      // Store the freshly-generated key in the app's login session.
      // The nsec persists in localStorage via @nostrify/react/login.
      loginActions.nsec(nsec);
      // TODO: publish kind 0 profile metadata { name: shopName, ... } and
      // persist the handle as a NIP-05-style identifier once the backend
      // handle registry is live.
      toast({
        title: "Shop created",
        description: `Welcome, @${handle.trim()}.`,
      });
      navigate("/app");
    } catch (err) {
      setIsCreating(false);
      toast({
        title: "Couldn't create your shop",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-5">
      <HandleField
        value={handle}
        onChange={setHandle}
        showValidation={handle.length > 0}
        valid={handleValid}
      />

      <ShopNameField value={shopName} onChange={setShopName} />

      <Disclosure>
        We'll generate a Nostr key and store it securely in this browser.
        You can export it any time.
      </Disclosure>

      <Button
        type="button"
        size="lg"
        className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
        disabled={!canSubmit}
        onClick={submit}
      >
        {isCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Create my shop"
        )}
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Tab 2 — Import existing key                       */
/* -------------------------------------------------------------------------- */

function ImportKeyForm() {
  const [stage, setStage] = useState<"choose" | "connected">("choose");
  const [npubDisplay, setNpubDisplay] = useState("");

  const [handle, setHandle] = useState("");
  const [shopName, setShopName] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  const loginActions = useLoginActions();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleConnect = async (method: ConnectMethod) => {
    try {
      if (method === "extension") {
        // TODO: replace with real NIP-07 prompt; library handles popup
        await loginActions.extension();
        setNpubDisplay("connected via extension");
      } else if (method === "nsec") {
        // TODO: surface a controlled input + reveal toggle instead of prompt()
        const input = window.prompt("Paste your nsec");
        if (!input) return;
        loginActions.nsec(input.trim());
        setNpubDisplay("connected via nsec");
      } else {
        // TODO: replace with real NIP-46 bunker:// flow + QR fallback
        const uri = window.prompt("Paste your bunker:// URI");
        if (!uri) return;
        await loginActions.bunker(uri.trim());
        setNpubDisplay("connected via remote signer");
      }
      setStage("connected");
    } catch (err) {
      toast({
        title: "Connection failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const open = async () => {
    if (!isHandleValid(handle) || shopName.trim().length < SHOP_NAME_MIN) return;
    setIsOpening(true);
    try {
      // TODO: publish kind 0 profile metadata under the connected key.
      toast({ title: "Shop opened", description: `Welcome, @${handle.trim()}.` });
      navigate("/app");
    } finally {
      setIsOpening(false);
    }
  };

  if (stage === "choose") {
    return (
      <div className="space-y-3">
        <ConnectOption
          icon={Puzzle}
          label="Browser extension"
          hint="Alby, nos2x, Flamingo"
          onClick={() => handleConnect("extension")}
        />
        <ConnectOption
          icon={Key}
          label="Paste nsec"
          hint="Your secret key from any Nostr app"
          onClick={() => handleConnect("nsec")}
        />
        <ConnectOption
          icon={Cloud}
          label="Remote signer"
          hint="NIP-46 / nsecbunker"
          onClick={() => handleConnect("bunker")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-surface/60 p-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10">
          <Check className="h-4 w-4 text-brand" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink">Connected successfully</p>
          <p className="truncate text-sm text-ink-soft">{npubDisplay}</p>
        </div>
      </div>

      <HandleField
        value={handle}
        onChange={setHandle}
        showValidation={handle.length > 0}
        valid={isHandleValid(handle)}
      />

      <ShopNameField value={shopName} onChange={setShopName} />

      <Button
        type="button"
        size="lg"
        className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
        disabled={
          !isHandleValid(handle) ||
          shopName.trim().length < SHOP_NAME_MIN ||
          isOpening
        }
        onClick={open}
      >
        {isOpening ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Opening...
          </>
        ) : (
          "Open my shop"
        )}
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Shared fields                                 */
/* -------------------------------------------------------------------------- */

function HandleField({
  value,
  onChange,
  showValidation,
  valid,
}: {
  value: string;
  onChange: (next: string) => void;
  showValidation: boolean;
  valid: boolean;
}) {
  return (
    <div>
      <Label htmlFor="handle">Shop handle</Label>
      <div className="relative mt-1.5 flex items-center">
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 text-sm text-ink-soft"
        >
          @
        </span>
        <Input
          id="handle"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          value={value}
          onChange={(e) =>
            onChange(e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase())
          }
          placeholder="yourshop"
          className="pl-7 pr-10"
        />
        {showValidation && (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute right-3 transition-opacity",
              valid ? "text-brand" : "text-rose-500",
            )}
          >
            {valid ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </span>
        )}
      </div>
    </div>
  );
}

function ShopNameField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <Label htmlFor="shop-name">Shop name</Label>
      <Input
        id="shop-name"
        className="mt-1.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Amaka's Boutique"
      />
    </div>
  );
}

function ConnectOption({
  icon: Icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-left transition-colors hover:border-ink/20 hover:bg-surface/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        <span className="block truncate text-xs text-ink-soft">{hint}</span>
      </span>
    </button>
  );
}

function Disclosure({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-surface/60 p-3">
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
      <p className="text-xs leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            "What is Nostr?" link                           */
/* -------------------------------------------------------------------------- */

function NostrInfoFooter() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mt-6 text-center">
        <button
          type="button"
          className="rounded px-2 py-1 text-xs text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          onClick={() => setOpen(true)}
        >
          What is Nostr? →
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>About Nostr</DialogTitle>
            <DialogDescription>
              Nostr is an open protocol for decentralised, censorship-resistant
              communication and commerce. Instead of relying on a central
              server, your identity is a cryptographic key that you own.
              That key is what owns your SafeSale shop.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setOpen(false)}>Got it</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function isHandleValid(handle: string): boolean {
  const cleaned = handle.trim();
  return cleaned.length >= HANDLE_MIN && /^[a-z0-9_]+$/.test(cleaned);
}
