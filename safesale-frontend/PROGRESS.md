# SafeSale — Redesign Progress Checkpoint

> **Purpose:** track the page-by-page UI/UX redesign of SafeSale. Each page goes through:
> **(a)** detailed Stitch design prompt → **(b)** Stitch generates HTML → **(c)** convert to a React + TypeScript + Tailwind + shadcn/ui component wired to existing hooks.
>
> Update this file whenever a page moves status. Commit immediately after a status change.

---

## Design system contract (applies to every prompt)

- React + TypeScript single component, no `any` types.
- Tailwind CSS 4 + shadcn/ui primitives only (Button, Card, Input, Label, Tabs, Dialog, Select, Textarea, etc.).
- `lucide-react` icons only — never Material Symbols or other icon sets.
- Semantic color tokens only: `bg-surface`, `bg-background`, `text-ink`, `text-ink-soft`, `bg-brand`, `text-brand-foreground`, `border-border`. **Do not invent new colors.**
- Mobile-first, responsive down to 360px.
- Soft shadows, `rounded-2xl` cards, `rounded-lg` inputs/buttons.
- WCAG 2.1 AA. `focus-visible:ring-2 ring-brand` on every interactive element.
- Visual direction: Stripe + Airbnb + Paystack — warm, modern, trustworthy, light mode only.
- No glassmorphism, no neon, no cyberpunk-crypto aesthetic.
- Include `// TODO:` comments where hooks should later be wired.

---

## The 9 core screens

Legend: ✅ done (designed + wired to live backend) · 🟡 in-progress · ⏭ next · ⬜ pending

| # | Screen | Route | Audience | Status | Notes |
|---|---|---|---|---|---|
| 1 | Seller Onboarding | `/onboarding` | New seller | ✅ | Stitch HTML in `.stitch-designs/01-onboarding.html` → React in `src/pages/Onboarding.tsx`; wired to `apiClient.createSeller` (POST /api/sellers) before the Nostr login is persisted, so duplicate-handle 409s surface cleanly. Stores the returned seller record via `useCurrentSeller`. Phone field is required (backend Zod minimum). |
| 2 | Seller Dashboard Home | `/app` | Seller | ✅ | Stitch HTML in `.stitch-designs/02-seller-dashboard.html` → React in `src/pages/app/DashboardHome.tsx`; KPIs (locked in escrow / paid out 7d / orders to ship / active listings) computed off `useSellerOrders` (GET /api/orders/seller/:npub, 15s poll) + `useMyListings`. "Needs your attention" surfaces payment_locked + disputed rows oldest-first. Reputation strip is placeholder until kind 1985 review feed is wired. |
| 3 | Seller Listings (list + create) | `/app/listings` | Seller | 🟡 | React component exists (`src/pages/app/ListingsPage.tsx`). Create-listing flow wired to `apiClient.createListing` (POST /api/listings) → uses the backend cuid as the Nostr kind 30018 `d` tag so /buy/:id and POST /api/orders agree. **Design hasn't been ported from a Stitch prompt yet — page still uses the original look.** |
| 4 | Seller Orders (list + detail) | `/app/orders` & `/app/orders/:token` | Seller | 🟡 | Detail page (`src/pages/app/OrderDetailPage.tsx`) fully wired: `apiClient.getOrder` (8s poll) + Mark Shipped → `apiClient.shipOrder`. **OrdersPage list view still reads `lib/mock.ts` — needs to switch to `useSellerOrders`.** Both need Stitch prompts + design pass. |
| 5 | Seller Earnings (Bitnob cash-out) | `/app/earnings` | Seller | ⬜ | React component exists but is a mock-fed stub. Backend has no /api/earnings endpoint yet; this screen is blocked on a Phase 8+ backend wire. |
| 6 | Public Listing | `/buy/:id` | Buyer | ✅ | Stitch HTML in `.stitch-designs/06-public-listing.html` → React in `src/pages/PublicListing.tsx`; wired to `useListing` (Nostr kind 30018 → fixture fallback for cold demos). |
| 7 | Buyer Checkout | `/checkout/:id` | Buyer | ✅ | Stitch HTML in `.stitch-designs/07-buyer-checkout.html` → React in `src/pages/Checkout.tsx`; wired to `apiClient.createOrder` + polling. |
| 8 | Buyer Order Page (release / dispute) | `/order/:token` | Buyer | ✅ | Stitch HTML in `.stitch-designs/08-buyer-order.html` → React in `src/pages/BuyerOrder.tsx`; wired to `apiClient.getOrder` (8s poll), `apiClient.releaseOrder` (signs with nsec from localStorage), `apiClient.openDispute`. 7-state hero, 4-step timeline, mobile sticky action bar. |
| 9 | Admin Dispute Dashboard | `/admin` | Mediator | ⬜ | Not designed, not wired. Blocked on backend kind 33889 mediator publishing being live. |

**Status: 6 / 9 screens design-complete + buyer-flow wired; 2 / 9 partially wired (3, 4); 1 / 9 pending (5, 9 separately).**

The escrow wedge — onboard → list → buy → pay → ship → release — runs end-to-end on Railway today.

### Deferred (not part of the 9 — polish or build later)

- Marketing pages: `/`, `/how-it-works`, `/for-sellers`
- Seller Reputation Panel — folded into the seller dashboard for MVP (per PRD §A); standalone `/app/reputation` route deleted
- Seller Settings / Profile (`/app/settings`) — not in code yet; add post-MVP
- Storefront `/:handle`, PayLink `/pay/:code`, Chat-as-page, Payment Requests — **deleted** (out of MVP per PRD)
- Return-flow sub-page (lives inside Buyer Order Page dispute flow)
- Admin Dispute Detail split-screen — design as part of #9 or as a follow-up

---

## Wiring track — backend integration status

The buyer slice is fully wired against the live Railway backend
(`https://safe-sales-backend-production.up.railway.app`). Seller wires
landed during Phase 8 step A–D. Switching modes between mock and real
is still a one-line env-var flip via `VITE_API_URL`.

### What's wired (verified against Railway)

| Frontend call | Backend route | Where wired | Commit |
|---|---|---|---|
| `apiClient.createSeller` | POST /api/sellers | `src/pages/Onboarding.tsx` | `b4a252a` |
| `apiClient.createListing` | POST /api/listings | `src/pages/app/ListingsPage.tsx` (`CreateListingSheet.onPublish`) | `f36719f` |
| `apiClient.shipOrder` | POST /api/orders/:token/ship | `src/pages/app/OrderDetailPage.tsx` (`shipMutation`) | `5403562` |
| `apiClient.getSellerOrders` | GET /api/orders/seller/:npub | `src/hooks/useSellerOrders.ts` → `DashboardHome` | `071d25e` |
| `apiClient.createOrder` | POST /api/orders | `src/pages/Checkout.tsx` | (pre Phase 8) |
| `apiClient.getOrder` | GET /api/orders/:token | `src/pages/BuyerOrder.tsx`, `OrderDetailPage` | (pre Phase 8) |
| `apiClient.releaseOrder` | POST /api/orders/:token/release | `BuyerOrder.tsx` (`releaseMutation`) | (pre Phase 8) |
| `apiClient.openDispute` | POST /api/orders/:token/dispute | `BuyerOrder.tsx` (`disputeMutation`) | (pre Phase 8) |

### Still on mock data (won't break demos — they're read paths only)

| Frontend call | Backend route to add | Where used | Notes |
|---|---|---|---|
| `getOrdersForSeller` etc. on `OrdersPage` | GET /api/orders/seller/:npub | `src/pages/app/OrdersPage.tsx` | List view; same endpoint the dashboard already uses. Trivial wire — just hasn't been done yet. |
| `payouts` / `earnings` from `lib/mock.ts` | (not designed yet) | `src/pages/app/EarningsPage.tsx` | Blocked on backend endpoints — no /api/earnings yet. |
| Dispute / return / review cards | kinds 33889, 1985 (Nostr) | `OrderDetailPage`, `BuyerOrder` (review prompt) | Removed from seller order detail in commit `5403562`; will return when 33889 + 1985 are live. |
| `currentSeller` fixture default | n/a | `lib/api/mocks.ts` cold-demo fallback | Only used when `VITE_API_URL` is unset. Safe. |

### Refactor pass before launch

Once every screen is wired, do one cleanup commit:
- Delete every `import { ... } from "@/lib/mock"` outside `src/lib/api/mocks.ts`.
- Delete the entire `currentSeller` / `orders` / `listings` exports from `lib/mock.ts` once nothing references them.
- Remove the seeded fixture in `lib/mock.ts` (commit `fd6ff2d`) that points at the manually-curl'd Railway listing — the create-listing flow now produces real listings.
- Refactor / consolidate the `ListingThumb` helper duplicated in `BuyerOrder.tsx` and `OrderDetailPage.tsx`.
- Drop `lib/buyerKey` exports that aren't called anywhere.
- Audit `PROGRESS.md` itself — when 9/9 are done, this file should compress to a single "ship state" paragraph, not a sprawling tracker.

---

## Saved Stitch outputs

Raw HTML from Stitch is committed to `.stitch-designs/` so we never lose a design to a crash again. After conversion to `.tsx`, the file stays as historical reference. Prompts sent to Stitch are committed as `NN-<slug>.prompt.md` next to their eventual HTML.

| Screen | Prompt | HTML output |
|---|---|---|
| 1 — Seller Onboarding | _(prompt not archived; predates convention)_ | `.stitch-designs/01-onboarding.html` |
| 2 — Seller Dashboard Home | `.stitch-designs/02-seller-dashboard.prompt.md` | `.stitch-designs/02-seller-dashboard.html` |
| 6 — Public Listing | `.stitch-designs/06-public-listing.prompt.md` | `.stitch-designs/06-public-listing.html` |
| 7 — Buyer Checkout | _(prompt not archived; predates convention)_ | `.stitch-designs/07-buyer-checkout.html` (renamed from `03-checkout.html` once canonical numbering stabilised) |
| 3 — Seller Listings | `.stitch-designs/03-seller-listings.prompt.md` | _(awaiting Stitch)_ |
| 4 — Seller Orders (list + detail) | _(awaiting prompt)_ | _(awaiting Stitch)_ |
| 5 — Seller Earnings | _(awaiting prompt)_ | _(awaiting Stitch)_ |
| 9 — Admin Dispute Dashboard | _(awaiting prompt)_ | _(awaiting Stitch)_ |

---

## Existing code map

### Pages (`src/pages/`)
- `Landing.tsx`, `HowItWorks.tsx`, `ForSellers.tsx` — marketing surface (deferred)
- `Onboarding.tsx` — single-screen Nostr signup (screen 1)
- `PublicListing.tsx`, `Checkout.tsx`, `BuyerOrder.tsx`, `PayLink.tsx` — buyer flow
- `Storefront.tsx` — public seller page `/:handle` (deferred)
- `Admin.tsx` — admin/mediator
- `NIP19Page.tsx`, `NotFound.tsx`

### Seller dashboard (`src/pages/app/`)
- `DashboardHome.tsx`, `ListingsPage.tsx`, `OrdersPage.tsx`, `OrderDetailPage.tsx`
- `EarningsPage.tsx`, `ReputationPage.tsx`
- `DisputePage.tsx`, `ChatPage.tsx`, `PaymentRequestsPage.tsx`

### Hooks (`src/hooks/`)
Standard mkstack hooks plus:
- `useCashuWallet` — mint connection (loading state)
- `useEscrowToken` — buyer escrow lifecycle

### Cashu (`src/lib/cashu/`)
- `types.ts` — SafeSale escrow token types + supported mints
- `wallet.ts` — create / preview / encode / receive helpers

### Nostr event spec
- `NIP.md` defines kinds `30018` (listings), `33888` (orders), `33889` (dispute resolutions), `1985` (reviews), `1059` (DMs)

---

## How to use this file

1. When we start a new screen, change its row to 🟡 with the prompt date.
2. When Stitch HTML is received, save it to `.stitch-designs/NN-<slug>.html` and keep status 🟡 until converted to `.tsx`.
3. When the React component is committed, flip to ✅ and add the commit hash.
4. Commit `PROGRESS.md` at the same time as any change so git history mirrors the checklist.
