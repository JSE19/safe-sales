# SafeSale

> **Trustless escrow for social-commerce sellers — works wherever you can paste a link.**

Instagram, WhatsApp, TikTok, X, Telegram, Threads, Linktree — anywhere a seller can share a URL, SafeSale lets buyers pay safely. Funds are locked in a **Cashu ecash escrow token** until the buyer confirms delivery. If anything goes wrong, a signed Nostr-based mediation process resolves the dispute publicly and auditably.

Submission for **Hack4Freedom**.

---

## How it works (60 seconds)

1. Seller signs up — a Nostr key is generated in their browser; that key *is* their account.
2. Seller creates a listing → SafeSale publishes it as a Nostr event and returns a permanent link (`safesale.app/buy/<id>`).
3. Seller pastes the link wherever they sell — IG bio, WhatsApp status, TikTok caption, X profile, etc.
4. Buyer taps the link, pays NGN into a unique Bitnob virtual account.
5. SafeSale converts the NGN to sats and mints a Cashu ecash token, **cryptographically locked** to the buyer's one-time Nostr pubkey.
6. Seller ships. Buyer confirms receipt → token unlocks → seller is paid in sats via Lightning, optionally auto-converted to NGN.
7. If the buyer doesn't act within 7 days of shipping, the token's locktime auto-releases to the seller.
8. If there's a dispute, the token is frozen until a SafeSale mediator resolves it. Every resolution is signed by the mediator's Nostr key and published publicly — permanent and auditable.

---

## What's in this repo

This repo contains the **SafeSale web frontend**. The backend service (Bitnob webhooks, mint operations, escrow service Nostr key, mediator key) lives in a separate codebase — see [`BACKEND.md`](./BACKEND.md) for the API contract.

```
src/
├── components/
│   ├── ui/            # shadcn/ui primitives
│   ├── safesale/      # SafeSale-specific components (Logo, EscrowShield, Timeline, ...)
│   └── auth/          # Nostr login UI
├── pages/             # Marketing, buyer, seller-dashboard, admin pages
├── hooks/             # Nostr + app hooks
├── lib/               # Types, fixtures, utilities
└── contexts/          # React contexts
```

## Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS 4** + **shadcn/ui** + **lucide-react**
- **Nostrify** (`@nostrify/react`) — Nostr identity, relays, event publishing
- **Cashu** (`@cashu/cashu-ts`, planned) — ecash escrow tokens with NUT-11 P2PK locking
- **TanStack Query** — data fetching and caching
- **React Router 7** — client-side routing

## Architecture

```
┌────────────────────┐     Nostr events (relays)      ┌────────────────────┐
│                    │ ◄──────────────────────────►   │                    │
│  Browser           │                                │  Nostr relays      │
│  (this repo)       │                                │                    │
│                    │     HTTP (REST + webhooks)     └────────────────────┘
│                    │ ◄──────────────────────────►
└────────────────────┘                                ┌────────────────────┐
                                                     │  SafeSale backend  │
                                                     │  - Bitnob webhooks │
                                                     │  - Mint operations │
                                                     │  - Escrow + Mediator│
                                                     │    Nostr keys      │
                                                     │  - Notifications   │
                                                     └────────────────────┘
                                                              ▲
                                                              │
                                                     ┌────────┴──────────┐
                                                     │  Bitnob (NGN↔sats)│
                                                     │  Nutshell (mint)  │
                                                     │  Termii (SMS)     │
                                                     └───────────────────┘
```

## Getting started

```bash
git clone git@github.com:JSE19/safe-sales.git
cd safe-sales
git checkout frontend
cp .env.example .env       # then fill in any local overrides
npm install
npm run dev
```

App runs at `http://localhost:8080`.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm test` | Type-check, lint, run unit tests, and verify the build (the full gate) |

## Branches

- **`main`** — stable, deployable. Protected. Merges only via PR.
- **`frontend`** — active frontend work.
- **`backend`** — active backend work (in a separate repo if/when split).
- **Feature branches** — `<area>/<slug>` off `frontend` or `backend`.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for full conventions.

## Documents

- [`PRD.md`](./PRD.md) — Full product spec. Source of truth.
- [`NIP.md`](./NIP.md) — Nostr event kinds, tags, validation rules.
- [`BACKEND.md`](./BACKEND.md) — Backend service API contract and integrations.
- [`BUSINESS.md`](./BUSINESS.md) — Monetization model.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — Branching, commits, code review.

## Status

This is an active hackathon submission. The frontend currently renders the full user flows against mock data. The next milestones are:

- [ ] Replace `currentSeller` mock with real Nostr identity (`useCurrentUser`)
- [ ] Persist listings as kind 30018 Nostr events
- [ ] Wire Cashu mint integration for P2PK-locked escrow
- [ ] Integrate the backend API for order lifecycle and Bitnob payments
- [ ] NIP-17 encrypted DMs between buyer and seller
- [ ] Signed mediator resolutions (kind 33889)

## License

TBD — the project will be open-sourced under **MIT** after the Hack4Freedom hackathon. Until then, all rights reserved.
