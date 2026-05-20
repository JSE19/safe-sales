import { useSeoMeta } from "@unhead/react";
import { useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/safesale/AppShell";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/safesale/ProductImage";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QRCodeCanvas } from "@/components/ui/qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  X,
  MessageSquare,
  Send,
  Share2,
  Plus,
  Eye,
  Bookmark,
  Check,
  ImagePlus,
  Link2 as LinkIcon,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { listings, currentSeller } from "@/lib/mock";
import { formatNGN, formatNumber } from "@/lib/format";
import { useToast } from "@/hooks/useToast";

export default function ListingsPage() {
  useSeoMeta({ title: "Listings — SafeSale" });
  const [open, setOpen] = useState(false);
  const [shareListing, setShareListing] = useState<(typeof listings)[number] | null>(null);

  return (
    <AppShell
      title="Listings"
      subtitle="Your products live here."
      action={
        <div className="flex items-center justify-between">
          <p className="text-xs text-ink-soft">
            {listings.length} active · {formatNumber(
              listings.reduce((s, l) => s + l.views, 0)
            )}{" "}
            views this month
          </p>
          <Button
            onClick={() => setOpen(true)}
            size="sm"
            className="h-8 rounded-md bg-brand text-xs text-brand-foreground hover:bg-brand/90"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> New
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {listings
          .filter((l) => l.sellerId === currentSeller.id)
          .map((l) => (
            <ListingCard 
              key={l.id} 
              listing={l} 
              onShare={() => setShareListing(l)} 
            />
          ))}

        <button
          onClick={() => setOpen(true)}
          className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-white/60 p-4 text-ink-soft transition-colors hover:border-brand/40 hover:bg-brand-soft/30 hover:text-brand"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand-soft-foreground">
            <Plus className="h-5 w-5" />
          </span>
          <p className="text-sm font-medium">Add listing</p>
          <p className="text-xs text-ink-soft">Photos, price, link</p>
        </button>
      </div>

      <CreateListingSheet open={open} onClose={() => setOpen(false)} />
      <ShareDialog 
        listing={shareListing} 
        open={!!shareListing} 
        onOpenChange={(o) => !o && setShareListing(null)} 
      />
    </AppShell>
  );
}

function ListingCard({ 
  listing, 
  onShare 
}: { 
  listing: (typeof listings)[number];
  onShare: () => void;
}) {
  return (
    <div className="group relative">
      <Link
        to={`/buy/${listing.id}`}
        className="block overflow-hidden rounded-2xl border border-border bg-white transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-16px_rgba(15,42,30,0.18)]"
      >
        <div className="relative">
          <ProductImage
            image={listing.images[0]}
            className="aspect-[4/5]"
            rounded="rounded-none"
          />
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-medium text-ink backdrop-blur-sm">
            <Eye className="h-3 w-3" />
            {formatNumber(listing.views)}
          </span>
        </div>
        <div className="p-3">
          <p className="line-clamp-2 text-xs font-medium leading-snug text-ink sm:text-sm">
            {listing.title}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">
              {formatNGN(listing.priceNGN)}
            </p>
            <span className="inline-flex items-center gap-1 text-[10px] text-ink-soft">
              <Bookmark className="h-3 w-3" />
              {listing.saves}
            </span>
          </div>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onShare();
        }}
        className="absolute bottom-14 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
      >
        <Share2 className="h-4 w-4" />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ShareDialog({ 
  listing, 
  open, 
  onOpenChange 
}: { 
  listing: (typeof listings)[number] | null; 
  open: boolean; 
  onOpenChange: (o: boolean) => void;
}) {
  const { toast } = useToast();
  if (!listing) return null;
  const shareLink = `safesale.app/buy/${listing.id}`;
  
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
            Let the world know about {listing.title}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex justify-center gap-6">
            <ShareButton 
              icon={Send} 
              label="WhatsApp" 
              color="bg-[#25D366]" 
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this ${listing.title} on SafeSale: https://${shareLink}`)}`, '_blank')}
            />
            <ShareButton 
              icon={MessageSquare} 
              label="Instagram" 
              color="bg-[#E4405F]" 
              onClick={() => {
                copy();
                toast({ title: "Link copied! Share to your stories." });
              }}
            />
            <ShareButton 
              icon={X} 
              label="X (Twitter)" 
              color="bg-black" 
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this ${listing.title} on SafeSale!`)}&url=${encodeURIComponent(`https://${shareLink}`)}`, '_blank')}
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/40 p-2">
            <span className="flex-1 truncate px-2 text-xs text-ink-soft font-mono">
              {shareLink}
            </span>
            <Button size="sm" variant="ghost" onClick={copy} className="h-8 text-xs font-semibold text-brand">
              Copy
            </Button>
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
  onClick 
}: { 
  icon: ComponentType<{ className?: string }>; 
  label: string; 
  color: string; 
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-2 transition-transform hover:scale-105"
    >
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-full text-white shadow-sm", color)}>
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-[10px] font-medium text-ink-soft">{label}</span>
    </button>
  );
}

function CreateListingSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<number[]>([0]);
  const [step, setStep] = useState<"form" | "share">("form");
  const { toast } = useToast();
  const linkValue = `safesale.to/${currentSeller.handle}/${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 32) || "new-listing"}`;

  const copy = (s: string) => {
    navigator.clipboard?.writeText(s).catch(() => undefined);
    toast({ title: "Copied to clipboard" });
  };

  const reset = () => {
    setTitle("");
    setPrice("");
    setDescription("");
    setPhotos([0]);
    setStep("form");
  };

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
      <SheetContent side="bottom" className="rounded-t-2xl p-0 sm:max-w-lg sm:mx-auto sm:right-auto sm:left-1/2 sm:-translate-x-1/2">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-border mt-3 sm:hidden" />
        <SheetHeader className="px-5 pt-4">
          <SheetTitle className="text-left text-lg">
            {step === "form" ? "New listing" : "Listing ready ✨"}
          </SheetTitle>
          <SheetDescription className="text-left">
            {step === "form"
              ? "Add a clear title, photos and price."
              : "Share this link in your Instagram bio or WhatsApp status."}
          </SheetDescription>
        </SheetHeader>

        <div className="max-h-[75vh] overflow-y-auto px-5 py-4 pb-8">
          {step === "form" && (
            <div className="space-y-5">
              <div>
                <Label>Photos</Label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {photos.map((p, i) => (
                    <div
                      key={i}
                      className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                    >
                      <ProductImage
                        image={{
                          seed: `new-${p}-${i}`,
                          hueA: 150 + i * 20,
                          hueB: 170 + i * 20,
                          label: "",
                        }}
                        className="h-full w-full"
                        rounded="rounded-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPhotos(photos.filter((_, idx) => idx !== i))
                        }
                        className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-ink-soft hover:text-ink"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setPhotos([...photos, photos.length])}
                      className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-ink-soft hover:border-brand/40 hover:bg-brand-soft/30 hover:text-brand"
                    >
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-[10px] font-medium">Add</span>
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-ink-soft">
                  Photos sell. Add at least 2 sharp, well-lit shots.
                </p>
              </div>

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
                    placeholder="25,000"
                    className="h-11 pl-7"
                  />
                </div>
              </div>

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

              <Button
                onClick={() => setStep("share")}
                disabled={!title || !price}
                size="lg"
                className="h-12 w-full rounded-lg bg-brand text-base font-semibold text-brand-foreground hover:bg-brand/90"
              >
                Create listing
              </Button>
            </div>
          )}

          {step === "share" && (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-2xl border border-border bg-white">
                <div className="grid grid-cols-2 gap-px bg-border">
                  {photos.slice(0, 2).map((p, i) => (
                    <ProductImage
                      key={i}
                      image={{
                        seed: `new-${p}-${i}`,
                        hueA: 150 + i * 20,
                        hueB: 170 + i * 20,
                        label: "",
                      }}
                      className="aspect-square"
                      rounded="rounded-none"
                    />
                  ))}
                </div>
                <div className="p-4">
                  <p className="text-sm font-semibold text-ink">{title}</p>
                  <p className="mt-1 text-base font-semibold text-ink">
                    ₦{Number(price).toLocaleString("en-NG")}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Share link
                </p>
                <div className="mt-2 flex items-stretch rounded-lg border border-border bg-white">
                  <div className="flex flex-1 items-center gap-2 px-3 text-sm text-ink">
                    <LinkIcon className="h-4 w-4 shrink-0 text-ink-soft" />
                    <span className="truncate">{linkValue}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copy(linkValue)}
                    className="inline-flex items-center gap-1 border-l border-border px-3 text-sm font-medium text-brand hover:bg-brand-soft/40"
                  >
                    <Copy className="h-4 w-4" /> Copy
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface-2/40 p-4">
                <div className="flex items-start gap-4">
                  <div className="rounded-md bg-white p-2">
                    <QRCodeCanvas value={`https://${linkValue}`} size={96} className="h-24 w-24" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">
                      Or share the QR
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      Perfect for stories, packaging, or business cards.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <ShareButton 
                  icon={Send} 
                  label="WhatsApp" 
                  color="bg-[#25D366] text-white" 
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check this out: https://${linkValue}`)}`, '_blank')}
                />
                <ShareButton 
                  icon={MessageSquare} 
                  label="Instagram" 
                  color="bg-[#E4405F] text-white" 
                  onClick={() => toast({ title: "Copy link and paste in bio/status" })}
                />
                <ShareButton 
                  icon={X} 
                  label="X (Twitter)" 
                  color="bg-black text-white" 
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Checkout my new listing: ${title}`)}&url=${encodeURIComponent(`https://${linkValue}`)}`, '_blank')}
                />
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


