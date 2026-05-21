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

## Page queue (PRD order)

Legend: ✅ done · 🟡 in-progress (prompt sent, awaiting Stitch HTML) · ⏭ next · ⬜ pending

| # | Page | Route | Audience | Status | Notes |
|---|---|---|---|---|---|
| 1 | Seller Onboarding | `/onboarding` | Seller | ✅ | Stitch HTML received; convert to `.tsx` when we loop back |
| 2 | Public Listing page | `/buy/:id` | Buyer | ⏭ | **next prompt to write** — the link buyers see first |
| 3 | Buyer Checkout | `/checkout/:id` | Buyer | ✅ | Stitch HTML received; convert to `.tsx` when we loop back |
| 4 | Buyer Order Page (release / dispute) | `/order/:token` | Buyer | ⬜ | most critical buyer screen |
| 5 | Seller Dashboard — Home | `/app` | Seller | ⬜ | |
| 6 | Seller Dashboard — Listings Panel | `/app/listings` | Seller | ⬜ | |
| 7 | Seller Dashboard — Listing Create / Edit | `/app/listings/new` (modal or page) | Seller | ⬜ | decide modal vs. dedicated page when we get there |
| 8 | Seller Dashboard — Orders Panel | `/app/orders` | Seller | ⬜ | |
| 9 | Seller Dashboard — Order Detail | `/app/orders/:id` | Seller | ⬜ | has the "Mark as Shipped" action |
| 10 | Seller Dashboard — Earnings Panel | `/app/earnings` | Seller | ⬜ | Bitnob cash-out |
| 11 | Seller Dashboard — Reputation Panel | `/app/reputation` | Seller | ⬜ | aggregated reviews + shareable npub link |
| 12 | Seller Dashboard — Profile & Identity / Settings | `/app/settings` | Seller | ⬜ | screen does not exist in code yet — create new |
| 13 | Buyer Dispute Form | modal inside #12 | Buyer | ⬜ | |
| 14 | Buyer Return-flow page | sub-flow of #13 | Buyer | ⬜ | damaged-return edge case |
| 15 | Seller Public Storefront | `/:handle` | Public | ⬜ | |
| 16 | Admin — Dispute Queue | `/admin` | Mediator | ⬜ | |
| 17 | Admin — Dispute Detail (split-screen) | `/admin/dispute/:id` | Mediator | ⬜ | route doesn't exist yet — create new |
| 18 | Marketing — Landing | `/` | Public | ⬜ | exists; polish only |
| 19 | Marketing — How It Works | `/how-it-works` | Public | ⬜ | exists; polish only |
| 20 | Marketing — For Sellers | `/for-sellers` | Public | ⬜ | exists; polish only |

---

## Existing code map (so we never lose track again)

### Pages (`src/pages/`)
- `Landing.tsx`, `HowItWorks.tsx`, `ForSellers.tsx` — marketing surface
- `Onboarding.tsx` — single-screen Nostr signup (page 1)
- `PublicListing.tsx`, `Checkout.tsx`, `BuyerOrder.tsx`, `PayLink.tsx` — buyer flow
- `Storefront.tsx` — public seller page `/:handle`
- `Admin.tsx` — admin/mediator (still one big file; PRD wants queue + detail split)
- `NIP19Page.tsx`, `NotFound.tsx`

### Seller dashboard (`src/pages/app/`)
- `DashboardHome.tsx` — last redesigned (commit `49d8b2d`, empty state + demo-mode toggle)
- `ListingsPage.tsx`, `OrdersPage.tsx`, `OrderDetailPage.tsx`
- `EarningsPage.tsx`, `ReputationPage.tsx`
- `DisputePage.tsx`, `ChatPage.tsx`, `PaymentRequestsPage.tsx`

### Hooks (`src/hooks/`)
Standard mkstack hooks plus:
- `useCashuWallet` — mint connection (loading state)
- `useEscrowToken` — buyer escrow lifecycle

### Cashu (`src/lib/cashu/`)
- `types.ts` — SafeSale escrow token types + supported mints
- `wallet.ts` — create / preview / encode / receive helpers
- `index.ts`, `cashu.test.ts`

### Nostr event spec
- `NIP.md` defines kinds `30018` (listings), `33888` (orders), `33889` (dispute resolutions), `1985` (reviews), `1059` (DMs)

---

## Saved Stitch outputs

Raw HTML from Stitch is saved under `.stitch-designs/` (one file per page) so we never lose a design to a crash again. After conversion to `.tsx`, the file stays in place as historical reference.

| Page | HTML file |
|---|---|
| 1 — Seller Onboarding | `.stitch-designs/01-onboarding.html` |
| 3 — Buyer Checkout | `.stitch-designs/03-checkout.html` |

---

## How to use this file

1. When we start a new page, change its row to 🟡 and add the prompt date.
2. When Stitch HTML is received, keep status 🟡 until converted to `.tsx`.
3. When the React component is committed, flip to ✅ and add the commit hash.
4. Commit `PROGRESS.md` at the same time as the code change so git history mirrors the checklist.
