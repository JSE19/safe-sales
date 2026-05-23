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
| 3 | Seller Listings (list + create) | `/app/listings` | Seller | ✅ | Stitch HTML in `.stitch-designs/03-seller-listings.html` → React in `src/pages/app/ListingsPage.tsx`. Snapshot strip + search/filter chips + 3-col card grid + mobile FAB. Create-listing wired to `apiClient.createListing` (POST /api/listings) since Phase 8 step B — backend cuid round-trips as the Nostr kind 30018 `d` tag. Edit + Mark out-of-stock surfaced as friendly "coming soon" toasts (backend has no PATCH /api/listings/:id yet — wires the moment that route ships). |
| 4 | Seller Orders (list + detail) | `/app/orders` & `/app/orders/:token` | Seller | ✅ | Stitch HTML in `.stitch-designs/04-seller-orders.html` → React in `src/pages/app/OrdersPage.tsx` + `src/pages/app/OrderDetailPage.tsx`; both pages already wired (list = `useSellerOrders` 15s poll, detail = `apiClient.getOrder` 8s poll + `apiClient.shipOrder`). List view: amber "Needs your attention" strip (sum of payment_locked + disputed, omitted when zero), search + 6 filter chips with live counts (pending_payment shows only under All), desktop table / mobile cards, 3 empty states + skeleton. Detail view: 2-col on lg+, status-aware hero card (Mark Shipped form inline only when payment_locked — replaces the previous dialog), ship-to panel with copy buttons, order summary with sats subtotal, 4-step activity timeline with alert variant on dispute/refund, mobile sticky action bar that scrolls to the inline ship form. |
| 5 | Seller Earnings (Bitnob cash-out) | `/app/earnings` | Seller | ⬜ | React component exists but is a mock-fed stub. Backend has no /api/earnings endpoint yet; this screen is blocked on a Phase 8+ backend wire. |
| 6 | Public Listing | `/buy/:id` | Buyer | ✅ | Stitch HTML in `.stitch-designs/06-public-listing.html` → React in `src/pages/PublicListing.tsx`; wired to `useListing` (Nostr kind 30018 → fixture fallback for cold demos). |
| 7 | Buyer Checkout | `/checkout/:id` | Buyer | ✅ | Stitch HTML in `.stitch-designs/07-buyer-checkout.html` → React in `src/pages/Checkout.tsx`; wired to `apiClient.createOrder` + polling. |
| 8 | Buyer Order Page (release / dispute) | `/order/:token` | Buyer | ✅ | Stitch HTML in `.stitch-designs/08-buyer-order.html` → React in `src/pages/BuyerOrder.tsx`; wired to `apiClient.getOrder` (8s poll), `apiClient.releaseOrder` (signs with nsec from localStorage), `apiClient.openDispute`. 7-state hero, 4-step timeline, mobile sticky action bar. |
| 9 | Admin Dispute Dashboard | `/admin` | Mediator | ⬜ | Not designed, not wired. Blocked on backend kind 33889 mediator publishing being live. |

**Status: 8 / 9 screens design-complete + wired; 0 / 9 partially wired; 2 / 9 pending (5 Earnings, 9 Admin).**

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
| `getOrdersForSeller` etc. on `OrdersPage` | GET /api/orders/seller/:npub | `src/pages/app/OrdersPage.tsx` | ✅ Wired in commit `c8a8394`. Same `useSellerOrders` query as the dashboard — both surfaces refresh together. |
| Edit listing + mark-out-of-stock toggle | PATCH /api/listings/:id (NEW route — not on backend yet) | `src/pages/app/ListingsPage.tsx` ListingCard More menu | Frontend surfaces both as friendly "coming soon" toasts so the seller knows they're real-but-not-yet-wired. One-line `apiClient.updateListing` mutation + Nostr republish (same `d` tag) when the backend route lands. |
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

## PRD deltas — what we ship vs. what the PRD specifies

The PRD describes the full SafeSale product end state. The hackathon
MVP makes eight conscious scope cuts so the **trustless-escrow wedge**
(buyer pays → seller ships → buyer releases → seller gets sats)
runs end-to-end on testnet within the 2-week build window. Track them
here so demo prep isn't blindsided.

| # | PRD says | We ship | Why deferred | Unblocks when |
|---|---|---|---|---|
| 1 | Buyer order link emailed / SMS'd at checkout | Shown on screen + bookmark prompt only | No transactional-email service wired (Resend/Postmark TBD) | Backend `/api/orders` adds an outbound mail hook |
| 2 | Buyer release triggers Lightning payout to seller's Lightning wallet | Backend marks order `completed` after Cashu redeem; **no actual LN melt to seller** | Backend STATE.md: "testnet mint can't melt mainnet invoices; skipped until mainnet ship" | Backend Phase 9 wires the fee melt + payout |
| 3 | Bitnob webhook detects bank transfer automatically | Bitnob fully mocked; we curl `POST /api/webhooks/bitnob` to advance state | Bitnob sandbox approval is slower than the 2-week clock | Bitnob sandbox key arrives |
| 4 | Completed trades published as signed Nostr reviews (kind 1985); seller dashboard shows aggregated reputation | Reputation strip on dashboard is placeholder copy for new sellers | Release endpoint on backend does not publish kind 1985 | Backend adds review-publishing on release |
| 5 | 72h direct buyer↔seller chat on order page (Phase 4C) | Not built — `OrderDetailPage` has no chat surface | Needs NIP-17 / kind 1059 gift-wrap DM UX, encryption keys, mailbox relay choice | Post-MVP design pass |
| 6 | Three-checkpoint photo evidence return flow (the damaged-return edge case) | Removed from `OrderDetailPage` in commit `5403562`; backend has no return-evidence model | Hardest flow in the spec; depends on real dispute kind 33889 + per-step photo uploads | Screen #9 (Admin Dispute Dashboard) + backend kind 33889 publishing |
| 7 | Admin Dispute Dashboard (Dashboard 3 — queue, detail, split-percentage slider, signed resolution) | Backend has mediator key + dispute records; UI is unbuilt (screen #9) | Pending Stitch prompt + design pass | Screen #9 lands |
| 8 | Seller Earnings: bank account on file, "Cash Out to Naira" via Bitnob, total sats earned | Page exists but reads `lib/mock.ts` payouts/earnings | No `/api/earnings` endpoint; no real Bitnob payout integration (see #2, #3) | Backend adds earnings + Bitnob payout |

### What we DO ship from the PRD (the trustless-escrow core)

All of these are live on Railway and verifiable end-to-end **today**:

- Browser-generated Nostr keypair, nsec in localStorage (Phase 1 step 1–2)
- Listing publish to Nostr kind 30018 + Postgres (Phase 1 step 5–8)
- Buyer checkout → backend creates order + (mock) Bitnob virtual account (Phase 2 step 1–8)
- Bitnob webhook → Cashu mint + NUT-11 P2PK lock to buyer's one-time pubkey (Phase 2 step 9–14)
- Seller receives Nostr DM on payment-locked (Phase 2 step 17)
- Seller "Mark Shipped" → `POST /api/orders/:token/ship` → status flip + buyer notification (Phase 3)
- Buyer "Release Payment" → mint verifies P2PK sig → order completes (Phase 4A step 5–9, minus the LN payout from delta #2)
- Buyer "Open Dispute" → token frozen, status flip, admin queue entry (Phase 4B step 1–7)

The escrow wedge — the actual hackathon submission — is real.

---

## Saved Stitch outputs

Raw HTML from Stitch is committed to `.stitch-designs/` so we never lose a design to a crash again. After conversion to `.tsx`, the file stays as historical reference. Prompts sent to Stitch are committed as `NN-<slug>.prompt.md` next to their eventual HTML.

| Screen | Prompt | HTML output |
|---|---|---|
| 1 — Seller Onboarding | _(prompt not archived; predates convention)_ | `.stitch-designs/01-onboarding.html` |
| 2 — Seller Dashboard Home | `.stitch-designs/02-seller-dashboard.prompt.md` | `.stitch-designs/02-seller-dashboard.html` |
| 6 — Public Listing | `.stitch-designs/06-public-listing.prompt.md` | `.stitch-designs/06-public-listing.html` |
| 7 — Buyer Checkout | _(prompt not archived; predates convention)_ | `.stitch-designs/07-buyer-checkout.html` (renamed from `03-checkout.html` once canonical numbering stabilised) |
| 3 — Seller Listings | `.stitch-designs/03-seller-listings.prompt.md` | `.stitch-designs/03-seller-listings.html` |
| 4 — Seller Orders (list + detail) | `.stitch-designs/04-seller-orders.prompt.md` | `.stitch-designs/04-seller-orders.html` |
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
