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

Legend: ✅ done · 🟡 in-progress (prompt sent, awaiting Stitch HTML) · ⏭ next · ⬜ pending

| # | Screen | Route | Audience | Status | Notes |
|---|---|---|---|---|---|
| 1 | Seller Onboarding | `/onboarding` | New seller | ✅ | Stitch HTML in `.stitch-designs/01-onboarding.html` |
| 2 | Seller Dashboard Home | `/app` | Seller | ⬜ | |
| 3 | Seller Listings (list + create) | `/app/listings` | Seller | ⬜ | |
| 4 | Seller Orders (list + detail with "Mark Shipped") | `/app/orders` & `/app/orders/:id` | Seller | ⬜ | |
| 5 | Seller Earnings (Bitnob cash-out) | `/app/earnings` | Seller | ⬜ | |
| 6 | Public Listing | `/buy/:id` | Buyer | 🟡 | Prompt sent — see `.stitch-designs/06-public-listing.prompt.md`. Awaiting Stitch HTML. |
| 7 | Buyer Checkout | `/checkout/:id` | Buyer | ✅ | Stitch HTML in `.stitch-designs/03-checkout.html` |
| 8 | Buyer Order Page (release / dispute) | `/order/:token` | Buyer | ⬜ | most critical buyer screen |
| 9 | Admin Dispute Dashboard | `/admin` | Mediator | ⬜ | |

**Progress: 2 / 9 complete.**

### Deferred (not part of the 9 — polish or build later)

- Marketing pages: `/`, `/how-it-works`, `/for-sellers`
- Seller Reputation Panel (`/app/reputation`) — exists in code; not redesign-critical for MVP
- Seller Settings / Profile (`/app/settings`) — not in code yet; add post-MVP
- Storefront `/:handle`, PayLink `/pay/:code`, Chat, Payment Requests — extras
- Return-flow sub-page (lives inside Buyer Order Page dispute flow)
- Admin Dispute Detail split-screen — design as part of #9 or as a follow-up

---

## Saved Stitch outputs

Raw HTML from Stitch is committed to `.stitch-designs/` so we never lose a design to a crash again. After conversion to `.tsx`, the file stays as historical reference. Prompts sent to Stitch are committed as `NN-<slug>.prompt.md` next to their eventual HTML.

| Screen | Prompt | HTML output |
|---|---|---|
| 1 — Seller Onboarding | _(prompt not archived; predates convention)_ | `.stitch-designs/01-onboarding.html` |
| 6 — Public Listing | `.stitch-designs/06-public-listing.prompt.md` | _(pending)_ |
| 7 — Buyer Checkout | _(prompt not archived; predates convention)_ | `.stitch-designs/03-checkout.html` (numbered from old ordering; safe to rename when next file lands) |

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
