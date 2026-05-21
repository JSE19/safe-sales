import { Link, NavLink, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Logo, LogoMark } from "./Logo";
import { Avatar } from "./Avatar";
import { currentSeller, disputes, getOrder } from "@/lib/mock";
import {
  Home,
  Package,
  Receipt,
  Wallet,
  Bell,
  Search,
  Scale,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface Props {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

// Mobile bottom-nav: 5 most-used (MVP per PRD §51-89).
const mobileTabs = [
  { to: "/app", icon: Home, label: "Home", end: true },
  { to: "/app/listings", icon: Package, label: "Listings" },
  { to: "/app/orders", icon: Receipt, label: "Orders" },
  { to: "/app/earnings", icon: Wallet, label: "Earnings" },
  { to: "/app/dispute", icon: Scale, label: "Disputes" },
];

function buildSidebarGroups() {
  const activeDisputes = disputes.filter((d) => {
    const o = getOrder(d.orderId);
    return o?.sellerId === currentSeller.id && d.status !== "resolved";
  }).length;

  return [
    {
      label: "Manage",
      items: [
        { to: "/app", icon: Home, label: "Home", end: true, badge: undefined as string | undefined },
        { to: "/app/listings", icon: Package, label: "Listings", end: false, badge: undefined },
        { to: "/app/orders", icon: Receipt, label: "Orders", end: false, badge: undefined },
        { to: "/app/earnings", icon: Wallet, label: "Earnings", end: false, badge: undefined },
      ],
    },
    {
      label: "Support",
      items: [
        {
          to: "/app/dispute",
          icon: Scale,
          label: "Disputes",
          end: false,
          badge: activeDisputes > 0 ? String(activeDisputes) : undefined,
        },
      ],
    },
  ];
}

export function AppShell({ children, title, subtitle, action }: Props) {
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const { pathname } = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Simulate real-time notif after 5s
    const timer = setTimeout(() => {
      toast({
        title: "New order received!",
        description: "You just got a new order for 'Vintage Denim Jacket'",
      });
      setHasUnread(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const activeTab = mobileTabs.find((t) =>
    t.end ? pathname === t.to : pathname.startsWith(t.to)
  );
  const sidebarGroups = buildSidebarGroups();

  return (
    <div className="min-h-screen bg-surface text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-background lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link to="/app">
            <Logo />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sidebarGroups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
                {group.label}
              </p>
              {group.items.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    cn(
                      "mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                         ? "bg-brand-soft text-brand-soft-foreground"
                         : "text-ink-soft hover:bg-secondary hover:text-ink"
                    )
                  }
                >
                  <t.icon className="h-4 w-4" />
                  <span className="flex-1">{t.label}</span>
                  {t.badge && (
                    <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                      {t.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <Avatar seed={currentSeller.avatarSeed} name={currentSeller.name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{currentSeller.name}</p>
              <p className="truncate text-xs text-ink-soft">@{currentSeller.handle}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
          <div className="flex h-14 items-center gap-3 px-4 lg:h-16 lg:px-8">
            <Link to="/app" className="lg:hidden">
              <LogoMark />
            </Link>
            <div className="flex-1 min-w-0">
              {title && (
                <p className="truncate text-base font-semibold text-ink lg:text-lg">
                  {title}
                </p>
              )}
              {subtitle && (
                <p className="truncate text-xs text-ink-soft lg:text-sm">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              className="hidden h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-secondary hover:text-ink md:inline-flex"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifsOpen(!notifsOpen);
                  if (!notifsOpen) setHasUnread(false);
                }}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-secondary hover:text-ink"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {hasUnread && (
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand" />
                )}
              </button>

              {notifsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setNotifsOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 z-20 w-80 overflow-hidden rounded-2xl border border-border bg-white shadow-xl animate-in fade-in zoom-in duration-200">
                    <div className="border-b border-border p-4">
                      <p className="text-sm font-semibold text-ink">Notifications</p>
                    </div>
                    <div className="max-h-[320px] overflow-y-auto">
                      {[
                        { id: 1, text: "New order received for Vintage Denim Jacket", time: "2m ago", unread: true },
                        { id: 2, text: "Payment of ₦42,000 released to your bank", time: "1h ago", unread: false },
                        { id: 3, text: "Chinedu A. sent you a message", time: "3h ago", unread: false },
                      ].map((n) => (
                        <div key={n.id} className={cn("p-4 border-b border-border/50 transition-colors hover:bg-secondary/40", n.unread && "bg-brand-soft/20")}>
                          <p className="text-sm text-ink leading-snug">{n.text}</p>
                          <p className="mt-1 text-[11px] text-ink-soft">{n.time}</p>
                        </div>
                      ))}
                    </div>
                    <Link to="/app/orders" className="block p-3 text-center text-xs font-medium text-brand hover:bg-brand-soft/40">
                      View all activity
                    </Link>
                  </div>
                </>
              )}
            </div>
            <div className="lg:hidden">
              <Avatar seed={currentSeller.avatarSeed} name={currentSeller.name} size={32} />
            </div>
          </div>
          {action && (
            <div className="border-t border-border/60 px-4 py-2 lg:px-8">{action}</div>
          )}
        </header>

        <main className="px-4 pb-28 pt-4 lg:px-8 lg:pb-12 lg:pt-6">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 pb-safe backdrop-blur-md lg:hidden">
        <ul className="grid grid-cols-5">
          {mobileTabs.map((t) => {
            const isActive = t === activeTab;
            return (
              <li key={t.to}>
                <NavLink
                  to={t.to}
                  end={t.end}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-1 py-2.5 text-[10px] font-medium",
                    isActive ? "text-brand" : "text-ink-soft"
                  )}
                >
                  <t.icon className={cn("h-5 w-5", isActive && "text-brand")} />
                  {t.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
