# SafeSale Backend — Session Resume State

> **READ THIS FIRST** at the start of every session. Skim it top-to-bottom in ~2 minutes and you'll have full context on what we're building, what's done, what's next, and the rules we work under.

Last updated: 2026-05-21 after Phase 6 completion.

---

## Project elevator pitch

**SafeSale** is a trustless escrow layer for Instagram & WhatsApp micro-sellers in West Africa. Buyers pay in NGN via bank transfer (Bitnob, mocked for MVP); the cash is converted to sats; a Cashu eCash token is minted and NUT-11 P2PK-locked to the buyer's Nostr pubkey; the seller is notified via encrypted Nostr DM; on buyer confirmation the token is redeemed and (in Phase 7) melted via Lightning to the seller — with a 1% fee skimmed to a SafeSale Lightning address.

Submission for **Hack4Freedom** (women-only, 2-week, hybrid hackathon for the Global South). Built by Joy + 1 partner. Partner owns the frontend at `safe-sales/`; this repo at `safe-sale-backend/` is the API.

The full Product Requirements Document is in `C:\Users\User\Downloads\SafeSwap_PRD (1).docx` (yes, the original name uses "SafeSwap" — it was renamed to **SafeSale** mid-project; any reference to "SafeSwap" in old docs/chat means SafeSale).

---

## Standing rules — non-negotiable

1. **Never push to GitHub without explicit instruction.** Commit locally; wait for the user to say "push" before any `git push`.
2. **Stop after each phase and wait for the user's approval** before starting the next phase. Even if the next phase is obvious. Even if the user said "go" earlier — that go applied to the current phase only.
3. **Never edit anything in `C:\Users\User\Documents\JOY\Bitcoin\safe-sales\`** — that's the partner's frontend, off-limits.
4. **`.env` is gitignored and contains real secrets** — never commit it, never echo its values back to the user in chat.
5. **Don't waste time on validation/questionnaires** — the user has noted these for later, they're not part of the build.

---

## Project layout

```
C:\Users\User\Documents\JOY\Bitcoin\
├── safe-sales\             # partner's frontend (React + Vite + Tailwind + Nostrify) — DO NOT TOUCH
└── safe-sale-backend\      # this project (Node + Fastify + Prisma + Cashu + Nostr)
```

Single GitHub repo (`https://github.com/JSE19/safe-sales`) with three branches:
- `main` — clean, working baseline (frontend)
- `frontend` — partner's active WIP
- `backend` — this work (the API)

The local folders are separate checkouts of the same repo on different branches. Treat them independently.

---

## Stack (locked in)

| Layer | Choice | Version |
|---|---|---|
| Runtime | Node.js | 22 |
| Web framework | Fastify | 5.x |
| Language | TypeScript strict (`noUnusedLocals` enforced, never `any`) | 5.6 |
| Validation | Zod | 3.x |
| DB | PostgreSQL | Railway-hosted |
| ORM | Prisma | 6.x |
| Cashu | `@cashu/cashu-ts` | 2.5 |
| Nostr | `nostr-tools` + `@nostrify/nostrify` | 2.x / 0.52 |
| Logger | pino + pino-pretty (dev) | 9.x |
| Dev runner | `tsx watch` | 4.x |

ESM (`"type": "module"`). NodeNext module resolution. Strict tsconfig (`noUnusedLocals` makes the typecheck a real safety net).

---

## What's built and verified (Phases 1–6, all complete)

| Phase | Deliverable | Status |
|---|---|---|
| 1 | tsconfig, package.json scripts, `"type": "module"`, .env.example, .gitignore | ✅ |
| 2 | Bootable Fastify server with `/health` + pino logger + Zod env validation + CORS | ✅ verified locally |
| 3 | Prisma schema (Seller, Listing, Order, Dispute, EscrowStatus enum, DisputeStatus enum) | ✅ migration `20260521030741_init` applied to Railway |
| 4 | One-shot Nostr keypair generator (`npm run keys:generate`) | ✅ brand key generated, in `.env` |
| 5 | 13 API routes: sellers (POST/GET), listings (POST/GET/list), orders (POST/GET/list), escrow ship/release/dispute, webhooks/bitnob, dev/simulate-payment | ✅ all typechecked + smoke-tested against real DB |
| 6 | Real Cashu mint + NUT-11 P2PK lock/redeem; Nostr DMs to seller (payment locked) and buyer (shipped); LNURL-pay resolver | ✅ end-to-end live test: wrong key 400, correct key redeems 9444 sats |

**Trustless guarantee proven:** smoke test at end of Phase 6 showed a wrong-key release attempt returned `{"error":{"code":"BAD_REQUEST","message":"Cashu redeem failed: Witness is missing for p2pk signature"}}`. Correct key returned `redeemedSats: 9444`. The SafeSale wedge is real.

---

## Key decisions made (don't re-litigate)

| Decision | Why |
|---|---|
| **Bitnob is mocked**, not integrated | Sandbox approval likely too slow for the 2-week clock. `POST /api/dev/simulate-payment` invokes the exact same `markOrderPaymentLocked` handler the real webhook would. |
| **Testnet only** (Cashu testnut + simulated NGN) | No real money during demo; mainnet swap is a config change for Phase 7+. |
| **`testnut.cashu.space` as the Cashu mint** | Public, supports NUT-11 P2PK, auto-pays its own quotes. Verified at boot via `verifyMintCapabilities()`. |
| **No self-hosted relay or mint** | Public Nostr relays + public Cashu mint = zero infra to manage during hackathon. |
| **No fee-split or LN melt in MVP** | The Coinos LN address the user has is mainnet; testnet mint can't melt mainnet invoices. Skipped until mainnet ship. Comments in `routes/escrow.ts` mark the exact spot to add it. |
| **Single mediator key = brand key** | For MVP, `MEDIATOR_NSEC = SAFESALE_NSEC`. Can be split into separate keys post-MVP. |
| **No frontend changes from backend side** | Partner owns `safe-sales/`. Backend exposes typed JSON; frontend wires up when ready. |
| **`"type": "module"` (ESM)** | Matches frontend. Modern Node default. |
| **TypeScript 5.6, Prisma 6.x pinned** | Latest 6.x and 7.x respectively had known issues; pinned to stable. |

---

## Environment variables (see `.env.example`)

The user's local `.env` has the real values. Don't echo them. Required for the server to boot:

- `DATABASE_URL` — Railway Postgres (`postgresql://postgres:***@ballast.proxy.rlwy.net:55666/railway`)
- `SAFESALE_NSEC` / `SAFESALE_NPUB` — brand identity (`npub1xpcapky6mjsh0jn4mm3rn2ex6zx2hamhudnttcryfs0h6jjaswmqpfrpwq` is public)
- `MEDIATOR_NSEC` / `MEDIATOR_NPUB` — same as brand for MVP
- `CASHU_MINT_URL` — `https://testnut.cashu.space`
- `SAFESALE_FEE_LN_ADDRESS` — Coinos LN address (mainnet, used only when Phase 7 wires real fee melt)
- `NOSTR_RELAYS` — `wss://relay.damus.io,wss://nos.lol,wss://relay.primal.net`
- `BITNOB_*` — left empty; mocked for MVP

---

## API surface (live now)

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Railway healthcheck |
| `POST` | `/api/sellers` | Create seller (npub, handle, name, location, phone, category, optional lnAddress + bank details) |
| `GET` | `/api/sellers/:handle` | Storefront data + reputation |
| `POST` | `/api/listings` | Create listing |
| `GET` | `/api/listings/:id` | Single listing |
| `GET` | `/api/listings?seller=npub1...` | Seller's listings |
| `POST` | `/api/orders` | Buyer creates order; returns `orderToken` + (mock) Bitnob virtual account |
| `GET` | `/api/orders/:token` | Buyer's order page data |
| `GET` | `/api/orders/seller/:npub` | Seller dashboard order list |
| `POST` | `/api/orders/:token/ship` | Mark shipped, start 7-day auto-release timer, DM buyer |
| `POST` | `/api/orders/:token/release` | **Buyer-signed Cashu redeem.** Body: `{ buyerPrivateKeyHex }`. Returns `{ order, redeemedSats, txRef }`. |
| `POST` | `/api/orders/:token/dispute` | Open dispute, freeze token, start 72h direct-resolution window |
| `POST` | `/api/webhooks/bitnob` | Bitnob credit notification (mocked) — triggers Cashu mint + lock + seller DM |
| `POST` | `/api/dev/simulate-payment` | Dev-only — invokes the same Cashu mint+lock+DM path. **404s in production.** |

Error envelope: `{ "error": { "code": "...", "message": "...", "details": ... } }`

---

## Frontend integration contract (for the partner)

The partner's frontend at `safe-sales/` currently reads from `src/lib/mock.ts`. To switch to the live backend, they need to:

1. Set `VITE_API_BASE` env var to the backend URL (`http://localhost:3000` in dev, the Railway URL in prod once Phase 7 deploys)
2. Replace `getSeller(...)`, `getListing(...)`, etc. in `mock.ts` with `fetch(...)` calls to the routes above
3. **On seller signup** (the existing 6-step wizard at `pages/Onboarding.tsx`): generate a Nostr keypair silently in browser, POST to `/api/sellers` with the npub + form fields, store the nsec in localStorage
4. **On listing creation:** POST to `/api/listings` with `sellerNpub` = the logged-in seller's npub
5. **On buyer checkout** (`pages/Checkout.tsx`): generate a one-time buyer keypair in browser, POST to `/api/orders`, save the `orderToken` and the buyer's nsec in localStorage keyed by `orderToken`
6. **On buyer release** (`pages/BuyerOrder.tsx` "Release Payment" button): POST to `/api/orders/:token/release` with `{ buyerPrivateKeyHex: <stored hex from localStorage> }`

The frontend already has all these pages — they just call mock functions. Wiring them is mostly find-and-replace.

---

## Git state at last session end

- **Local branch:** `backend`
- **Tracking:** `origin/backend` — fully pushed (no unpushed commits)
- **Recent commits:**
  - `9170ef6` feat(backend): Phase 6 - real Cashu P2PK escrow + Nostr DMs wired into routes
  - `02adda0` chore(db): initial migration (Seller, Listing, Order, Dispute, enums)
  - `77ed872` feat(backend): add API routes (sellers, listings, orders, escrow, webhooks, dev)
  - `8ada87e` feat(backend): add Prisma schema (Seller, Listing, Order, Dispute) and DB client
  - `159b402` feat(backend): add Nostr keypair generator for SafeSale brand identity
  - `9149145` feat(backend): scaffold Fastify server with env validation and /health
  - `75f2396` First Backend Push (initial scaffold from user before our work began)

---

## What's NEXT (Phase 7 — awaiting user approval)

The hackathon trajectory from here:

### Phase 7 (next) — Deploy backend to Railway
- Connect Railway to the GitHub `backend` branch
- Set env vars in Railway dashboard (all of `.env.example` with real values)
- Confirm `/health` returns 200 on the public URL
- Get the URL (something like `https://safe-sales-backend-production-xxxx.up.railway.app`) and give it to the user / partner for frontend wiring
- Walk-through is straightforward; user has Railway account already (created for Postgres in Phase 3)

### Phase 8 (after deploy) — Frontend integration with partner's code
- Wire `safe-sales/` to the live Railway backend
- Partner does the React side; we provide CORS, debugging, response-shape fixes

### Phase 9+ (post-MVP, possibly post-hackathon)
- Real Lightning melt on release (99% to seller, 1% to `SAFESALE_FEE_LN_ADDRESS`) — the comments in `src/routes/escrow.ts` mark the exact spot
- Bitnob sandbox integration when API key arrives (the email draft is in chat history; user sent it)
- NIP-32 review event publication on completion (helpers already exist in `src/services/nostr.ts`)
- Admin dispute resolution UI wiring
- 7-day silent-buyer auto-release background job (cron-like)
- Mainnet ship (switch `CASHU_MINT_URL`, switch `BITNOB_BASE_URL`)

---

## Useful commands

```powershell
# from C:\Users\User\Documents\JOY\Bitcoin\safe-sale-backend\

# Dev server (hot reload)
npm run dev

# Typecheck only
npm run typecheck

# Production build
npm run build

# Generate a fresh Nostr keypair (one-shot)
npm run keys:generate

# Apply a new schema migration
npm run db:migrate

# Refresh Prisma client after schema change
npm run db:generate

# Open Prisma Studio (visual DB browser)
npm run db:studio
```

---

## How to verify everything still works after restart

```powershell
# 1. From safe-sale-backend/
npm install              # in case lockfile changed
npm run typecheck        # should be silent (zero errors)
npm run dev              # server should boot, log "SafeSale backend listening"

# 2. In another terminal, hit /health
curl http://127.0.0.1:3000/health
# Expect: {"ok":true,"service":"safe-sale-backend","env":"development","uptime":N}

# 3. (Optional) Run the full Phase 6 smoke test
powershell -ExecutionPolicy Bypass -File C:\Users\User\AppData\Local\Temp\opencode\phase6-e2e.ps1
# (NOTE: that file is temp; user may need to recreate or skip)
```

---

## Open questions for the user when they return

These will need answers to make smart progress on Phase 7+:

1. **Phase 7 (Railway deploy) approval?** Or pause longer?
2. **Has the partner started wiring the frontend** to the API? If yes, what works/breaks?
3. **Any Bitnob sandbox response** from the email sent earlier? (If yes, we can swap the mock for real.)
4. **Anything from the demo trial** that surfaced UX issues?

---

## Things I (assistant) should remember about the user's preferences

- Communication style: direct, structured, scannable. Prefers tables and headers. Does not need emoji clutter.
- Decision style: gives short answers; trust their gut even when curt ("go", "yes", "B", "I have noted").
- Risk tolerance: pragmatic. Will skip features for ship-velocity if cost-benefit is clear.
- Wants to *understand* what's happening, not just have it happen. Honest reality-check responses preferred over confident-sounding ones.
- Has a frontend partner; respects role separation strictly.
- Bitcoin/Nostr/Cashu literacy: developing — comfortable with the concepts but learning the operational details (rotation, mint mechanics, LNURL).
- Time zone: Nigeria (WAT). Active in evening hours.

"Read STATE.md in safe-sale-backend"