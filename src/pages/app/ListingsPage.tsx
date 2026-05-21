import { useSeoMeta } from "@unhead/react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentType,
} from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { AppShell } from "@/components/safesale/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeCanvas } from "@/components/ui/qrcode";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Check,
  ImagePlus,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Share2,
  ShieldCheck,
  X,
} from "lucide-react";

import { cn, sanitizeUrl } from "@/lib/utils";
import { formatNGN } from "@/lib/format";
import { useToast } from "@/hooks/useToast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { useUploadFile } from "@/hooks/useUploadFile";
import { useMyListings, type MyListing } from "@/hooks/useMyListings";

/* -------------------------------------------------------------------------- */
/*                                  Page                                      */
/* -------------------------------------------------------------------------- */

export default function ListingsPage() {
  useSeoMeta({ title: "Listings — SafeSale" });

  const { user } = useCurrentUser();
  const { data: listings = [], isLoading, error } = useMyListings();
  const [createOpen, setCreateOpen] = useState(false);
  const [shareListing, setShareListing] = useState<MyListing | null>(null);

  return (
    <AppShell
      title="Listings"
      subtitle="Your products live here."
      action={
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-soft">
            {user
              ? `${listings.length} ${listings.length === 1 ? "listing" : "listings"}`
              : "Sign in to manage your shop"}
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            disabled={!user}
            size="sm"
            className="h-8 rounded-md bg-brand text-xs text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> New
          </Button>
        </div>
      }
    >
      {!user ? (
        <SignedOutState />
      ) : isLoading ? (
        <ListingsGridSkeleton />
      ) : error ? (
        <ErrorState message={error instanceof Error ? error.message : "Couldn't load your listings."} />
      ) : (
        <ListingsGrid
          listings={listings}
          onAdd={() => setCreateOpen(true)}
          onShare={setShareListing}
        />
      )}

      <CreateListingSheet
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onPublished={(l) => setShareListing(l)}
      />
      <ShareDialog
        listing={shareListing}
        open={!!shareListing}
        onOpenChange={(o) => !o && setShareListing(null)}
      />
    </AppShell>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  States                                    */
/* -------------------------------------------------------------------------- */

function SignedOutState() {
  return (
    <div className="grid place-items-center py-16">
      <div className="max-w-sm rounded-2xl border border-dashed border-border bg-background p-8 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <p className="mt-4 text-base font-semibold text-ink">
          Sign in to manage your listings
        </p>
        <p className="mt-1 text-sm text-ink-soft">
          Your Nostr key signs every listing — no central account, no platform
          gatekeeping.
        </p>
        <Button
          asChild
          className="mt-5 bg-brand text-brand-foreground hover:bg-brand/90"
        >
          <Link to="/onboarding">Get started</Link>
        </Button>
      </div>
    </div>
  );
}

function ListingsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background p-8 text-center">
      <p className="text-sm font-medium text-ink">Couldn't load listings</p>
      <p className="mt-1 text-xs text-ink-soft">{message}</p>
    </div>
  );
}

function ListingsGrid({
  listings,
  onAdd,
  onShare,
}: {
  listings: MyListing[];
  onAdd: () => void;
  onShare: (l: MyListing) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} onShare={() => onShare(l)} />
      ))}

      <button
        type="button"
        onClick={onAdd}
        className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background/60 p-4 text-ink-soft transition-colors hover:border-brand/40 hover:bg-brand-soft/30 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-soft-foreground">
          <Plus className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium">Add listing</p>
        <p className="text-xs text-ink-soft">Photos, price, link</p>
      </button>
    </div>
  );
}

function ListingCard({
  listing,
  onShare,
}: {
  listing: MyListing;
  onShare: () => void;
}) {
  const cover = sanitizeUrl(listing.images[0]);
  return (
    <div className="group relative">
      <Link
        to={`/buy/${listing.id}`}
        className="block overflow-hidden rounded-2xl border border-border bg-background transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-16px_rgba(15,42,30,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <div className="relative">
          {cover ? (
            <img
              src={cover}
              alt=""
              loading="lazy"
              className="aspect-[4/5] w-full object-cover"
            />
          ) : (
            <div className="aspect-[4/5] w-full bg-secondary" aria-hidden />
          )}
        </div>
        <div className="p-3">
          <p className="line-clamp-2 text-xs font-medium leading-snug text-ink sm:text-sm">
            {listing.title}
          </p>
          <p className="mt-2 text-sm font-semibold text-ink">
            {formatNGN(listing.priceNGN)}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onShare();
        }}
        aria-label={`Share ${listing.title}`}
        className="absolute bottom-14 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/95 text-brand shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background focus-visible:outline-none focus-visible:opacity-100"
      >
        <Share2 className="h-4 w-4" />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Share dialog                                  */
/* -------------------------------------------------------------------------- */

function ShareDialog({
  listing,
  open,
  onOpenChange,
}: {
  listing: MyListing | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { toast } = useToast();
  if (!listing) return null;
  const shareLink = buyUrlFor(listing.id);

  const copy = () => {
    navigator.clipboard?.writeText(shareLink);
    toast({ title: "Link copied" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Share product</DialogTitle>
          <DialogDescription>
            Paste this link anywhere you sell — Instagram bio, WhatsApp
            status, TikTok caption, X profile.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex justify-center gap-6">
            <ShareButton
              icon={Send}
              label="WhatsApp"
              color="bg-[#25D366]"
              onClick={() =>
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(`Check out this ${listing.title} on SafeSale: ${shareLink}`)}`,
                  "_blank",
                )
              }
            />
            <ShareButton
              icon={MessageSquare}
              label="Instagram"
              color="bg-[#E4405F]"
              onClick={() => {
                copy();
                toast({
                  title: "Link copied! Share to your stories.",
                });
              }}
            />
            <ShareButton
              icon={X}
              label="X (Twitter)"
              color="bg-black"
              onClick={() =>
                window.open(
                  `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this ${listing.title} on SafeSale!`)}&url=${encodeURIComponent(shareLink)}`,
                  "_blank",
                )
              }
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2">
            <span className="flex-1 truncate px-2 font-mono text-xs text-ink-soft">
              {shareLink}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={copy}
              className="h-8 text-xs font-semibold text-brand"
            >
              Copy
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-background p-3 text-center">
            <QRCodeCanvas value={shareLink} size={120} className="mx-auto" />
            <p className="mt-2 text-[11px] text-ink-soft">
              Or share the QR
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShareButton({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 transition-transform hover:scale-105 focus-visible:outline-none"
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full text-white shadow-sm",
          color,
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-[10px] font-medium text-ink-soft">{label}</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Create listing sheet                              */
/* -------------------------------------------------------------------------- */

interface PendingPhoto {
  /** Stable key for React lists. */
  key: string;
  /** Local file the user selected. */
  file: File;
  /** Data URL for preview while it uploads. */
  previewUrl: string;
  /** Final Blossom URL after a successful upload, else null. */
  uploadedUrl: string | null;
  status: "uploading" | "ready" | "error";
  errorMessage?: string;
}

function CreateListingSheet({
  open,
  onClose,
  onPublished,
}: {
  open: boolean;
  onClose: () => void;
  onPublished: (listing: MyListing) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const { mutateAsync: publish, isPending: isPublishing } = useNostrPublish();
  const { mutateAsync: uploadFile } = useUploadFile();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset state when the sheet closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setTitle("");
        setPrice("");
        setDescription("");
        setPhotos([]);
        setError(null);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  const uploadedPhotos = useMemo(
    () => photos.filter((p): p is PendingPhoto & { uploadedUrl: string } =>
      p.status === "ready" && p.uploadedUrl !== null,
    ),
    [photos],
  );
  const stillUploading = photos.some((p) => p.status === "uploading");
  const canPublish =
    !!user &&
    title.trim().length > 1 &&
    Number(price) > 0 &&
    uploadedPhotos.length > 0 &&
    !stillUploading &&
    !isPublishing;

  const onFilesPicked = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file
    if (files.length === 0) return;

    const remainingSlots = Math.max(0, 4 - photos.length);
    const accepted = files.slice(0, remainingSlots);

    const newPending: PendingPhoto[] = accepted.map((file) => ({
      key: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      uploadedUrl: null,
      status: "uploading",
    }));

    setPhotos((prev) => [...prev, ...newPending]);

    // Upload sequentially so we don't hammer the Blossom server.
    for (const photo of newPending) {
      try {
        const tags = await uploadFile(photo.file);
        const url = tags[0]?.[1];
        if (!url) {
          throw new Error("Upload didn't return a URL");
        }
        setPhotos((prev) =>
          prev.map((p) =>
            p.key === photo.key
              ? { ...p, uploadedUrl: url, status: "ready" }
              : p,
          ),
        );
      } catch (err) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.key === photo.key
              ? {
                  ...p,
                  status: "error",
                  errorMessage:
                    err instanceof Error ? err.message : "Upload failed",
                }
              : p,
          ),
        );
      }
    }
  };

  const removePhoto = (key: string) => {
    setPhotos((prev) => {
      const next = prev.filter((p) => p.key !== key);
      // Revoke the object URL of the removed photo to free memory
      const removed = prev.find((p) => p.key === key);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  // Cleanup any remaining object URLs on unmount
  useEffect(() => {
    return () => {
      for (const p of photos) URL.revokeObjectURL(p.previewUrl);
    };
    // We intentionally only want to clean up the final value when unmounting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPublish = async () => {
    if (!canPublish || !user) return;
    setError(null);
    const id =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    const priceNGN = Number(price);
    const now = Math.floor(Date.now() / 1000);

    // Build kind 30018 tags per NIP.md §49-99
    const tags: string[][] = [
      ["d", id],
      ["title", title.trim()],
      ["price", String(priceNGN), "NGN"],
      ["published_at", String(now)],
      ["stock", "1"],
      ["r", buyUrlFor(id)],
    ];
    for (const photo of uploadedPhotos) {
      tags.push(["image", photo.uploadedUrl]);
    }

    try {
      const event = await publish({
        kind: 30018,
        content: description.trim(),
        tags,
        created_at: now,
      });

      toast({
        title: "Listing published",
        description: "It's live on Nostr — share the link to start selling.",
      });

      // Force the seller's listings grid to refresh, but in case the
      // relay is slow to echo back, optimistically construct the
      // MyListing object and hand it to the share dialog directly.
      queryClient.invalidateQueries({
        queryKey: ["safesale", "my-listings", user.pubkey],
      });

      const optimistic: MyListing = {
        id,
        title: title.trim(),
        description: description.trim(),
        priceNGN,
        images: uploadedPhotos.map((p) => p.uploadedUrl),
        inStock: 1,
        publishedAt: now,
        event,
      };
      onClose();
      // Open the share dialog after the sheet has closed
      setTimeout(() => onPublished(optimistic), 250);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Couldn't publish your listing right now. Try again.";
      setError(msg);
      toast({
        title: "Publish failed",
        description: msg,
        variant: "destructive",
      });
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-0 sm:left-1/2 sm:right-auto sm:mx-auto sm:max-w-lg sm:-translate-x-1/2"
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border sm:hidden" />
        <SheetHeader className="px-5 pt-4">
          <SheetTitle className="text-left text-lg">New listing</SheetTitle>
          <SheetDescription className="text-left">
            Add a clear title, photos and price. Published to Nostr with your
            key.
          </SheetDescription>
        </SheetHeader>

        <div className="max-h-[75vh] overflow-y-auto px-5 py-4 pb-8">
          <div className="space-y-5">
            {/* Photos */}
            <div>
              <Label>Photos</Label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {photos.map((p) => (
                  <div
                    key={p.key}
                    className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    <img
                      src={p.previewUrl}
                      alt=""
                      className={cn(
                        "h-full w-full object-cover",
                        p.status === "uploading" && "opacity-60",
                        p.status === "error" && "opacity-40",
                      )}
                    />
                    {p.status === "uploading" && (
                      <span
                        aria-label="Uploading"
                        className="absolute inset-0 grid place-items-center bg-black/20 text-white"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </span>
                    )}
                    {p.status === "error" && (
                      <span
                        title={p.errorMessage}
                        className="absolute inset-0 grid place-items-center bg-rose-700/30 text-[10px] font-semibold text-white"
                      >
                        Failed
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(p.key)}
                      aria-label="Remove photo"
                      className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-ink-soft hover:text-ink"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {photos.length < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-ink-soft hover:border-brand/40 hover:bg-brand-soft/30 hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Add</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={onFilesPicked}
              />
              <p className="mt-2 text-xs text-ink-soft">
                Photos sell. Add at least one sharp, well-lit shot.
                {stillUploading && (
                  <span className="ml-1 inline-flex items-center gap-1 text-brand">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Uploading…
                  </span>
                )}
              </p>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Vintage Levi's 501 Jeans"
                className="mt-1.5 h-11"
              />
            </div>

            {/* Price */}
            <div>
              <Label htmlFor="price">Price</Label>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-soft">
                  ₦
                </span>
                <Input
                  id="price"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="25000"
                  className="h-11 pl-7"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Condition, size, what's included…"
                className="mt-1.5 min-h-[100px]"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                {error}
              </div>
            )}

            <Button
              onClick={onPublish}
              disabled={!canPublish}
              size="lg"
              className="h-12 w-full rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing to Nostr…
                </>
              ) : stillUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Waiting for uploads…
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Publish listing
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Helpers                                    */
/* -------------------------------------------------------------------------- */

function buyUrlFor(id: string): string {
  const base =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_APP_URL) ||
    (typeof window !== "undefined" ? window.location.origin : "https://safesale.app");
  return `${base.replace(/\/$/, "")}/buy/${id}`;
}
