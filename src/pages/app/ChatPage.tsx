import { useSeoMeta } from "@unhead/react";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/safesale/Logo";
import { Avatar } from "@/components/safesale/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Timeline } from "@/components/safesale/Timeline";
import { chat as initialChat, getOrder, getListing } from "@/lib/mock";
import { formatTime, formatNGN } from "@/lib/format";
import {
  ChevronLeft,
  Paperclip,
  Send,
  ShieldCheck,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";

export default function ChatPage() {
  useSeoMeta({ title: "Chat — SafeSale" });
  const order = getOrder("SS-7395")!;
  const listing = getListing(order.listingId)!;

  const [messages, setMessages] = useState<ChatMessage[]>(initialChat);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!text.trim()) return;
    setMessages((m) => [
      ...m,
      {
        id: `m-${Date.now()}`,
        from: "seller",
        text: text.trim(),
        at: new Date().toISOString(),
      },
    ]);
    setText("");
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-surface">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
          <Link
            to="/app/orders"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-secondary hover:text-ink"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Avatar seed={order.buyerName} name={order.buyerName} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">
              {order.buyerName}
            </p>
            <p className="truncate text-[11px] text-ink-soft">
              {order.shortId} · {formatNGN(order.amountNGN)} ·{" "}
              <span className="text-brand">Payment locked</span>
            </p>
          </div>
          <div className="hidden md:block">
            <Logo variant="full" />
          </div>
        </div>
      </header>

      <div className="grid flex-1 min-h-0 lg:grid-cols-[1fr,320px]">
        {/* Messages */}
        <main className="flex min-h-0 flex-col">
          {/* Order banner */}
          <div className="border-b border-border/60 bg-background/60 px-4 py-2 backdrop-blur">
            <Link
              to={`/app/orders/${order.shortId}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-white p-2 transition-colors hover:bg-surface-2/40"
            >
              <div className="h-10 w-10 overflow-hidden rounded-lg">
                <img
                  alt=""
                  className="hidden"
                />
                {/* placeholder square */}
                <div className="h-full w-full bg-gradient-to-br from-emerald-100 to-emerald-200" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-ink">
                  {listing.title}
                </p>
                <p className="text-[10px] text-ink-soft">Order {order.shortId}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand-soft-foreground">
                <ShieldCheck className="h-3 w-3" />
                Protected
              </span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <ul className="mx-auto max-w-2xl space-y-3">
              {messages.map((m) => (
                <Bubble key={m.id} m={m} />
              ))}
              <div ref={endRef} />
            </ul>
          </div>

          {/* Composer */}
          <div className="border-t border-border bg-background px-3 py-3 pb-safe">
            <div className="mx-auto flex max-w-2xl items-center gap-2">
              <button className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-secondary hover:text-ink">
                <Paperclip className="h-4 w-4" />
              </button>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Message buyer…"
                className="h-11 rounded-full bg-secondary px-4"
              />
              <Button
                onClick={send}
                disabled={!text.trim()}
                size="icon"
                className="h-11 w-11 rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </main>

        {/* Right rail (desktop) */}
        <aside className="hidden overflow-y-auto border-l border-border bg-background p-5 lg:block">
          <h2 className="text-sm font-semibold text-ink">Order status</h2>
          <Timeline
            className="mt-4"
            steps={[
              { key: "p", title: "Placed", state: "done", at: formatTime(order.createdAt) },
              { key: "l", title: "Payment locked", state: "done", at: formatTime(order.updatedAt) },
              { key: "s", title: "Shipped", state: "done", at: formatTime(order.shippedAt!) },
              { key: "d", title: "Delivered", state: "done", at: formatTime(order.deliveredAt!) },
              { key: "r", title: "In dispute", state: "alert" },
            ]}
          />

          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50/50 p-4">
            <Scale className="h-5 w-5 text-rose-600" />
            <p className="mt-2 text-sm font-medium text-rose-900">Mediator joined</p>
            <p className="mt-1 text-xs text-rose-800/80">
              Help us understand by replying with photos or your shipping
              receipt.
            </p>
          </div>

          <div className="mt-6 space-y-2 text-xs">
            <p className="text-ink-soft">Quick replies</p>
            <button className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-left text-sm hover:border-brand/40">
              "I'm sorry — let me check the photos."
            </button>
            <button className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-left text-sm hover:border-brand/40">
              "I can offer a partial refund of ₦8,000."
            </button>
            <button className="block w-full rounded-lg border border-border bg-white px-3 py-2 text-left text-sm hover:border-brand/40">
              "Please ship it back and I'll fully refund."
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Bubble({ m }: { m: ChatMessage }) {
  if (m.from === "system") {
    return (
      <li className="flex items-center justify-center gap-2 py-1 text-[11px] text-ink-soft">
        <ShieldCheck className="h-3.5 w-3.5 text-brand" />
        {m.text}
      </li>
    );
  }
  const mine = m.from === "seller";
  return (
    <li className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className="max-w-[80%]">
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-snug",
            mine
              ? "rounded-br-md bg-brand text-brand-foreground"
              : "rounded-bl-md bg-white text-ink ring-1 ring-border"
          )}
        >
          {m.text}
          {m.attachment && (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px]",
                mine ? "bg-white/15 text-white" : "bg-secondary text-ink-soft"
              )}
            >
              <Paperclip className="h-3 w-3" />
              {m.attachment.label}
            </div>
          )}
        </div>
        <p
          className={cn(
            "mt-1 text-[10px] tabular-nums text-ink-soft",
            mine ? "text-right" : "text-left"
          )}
        >
          {formatTime(m.at)}
        </p>
      </div>
    </li>
  );
}


