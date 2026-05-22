# SafeSale Backend — Session Resume State

> **READ THIS FIRST** at the start of every session. Skim it top-to-bottom in ~2 minutes and you'll have full context on what we're building, what's done, what's next, and the rules we work under.

Last updated: 2026-05-22 after Phase 7 completion (Railway deploy live + smoke 8/8 green).

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
├── safe-sales\                          # partner's frontend (React + Vite + Tailwind + Nostrify) — DO NOT TOUCH
└── safe-sale-backend\
    └── safe-sales-backend\              # this project (Node + Fastify + Prisma + Cashu + Nostr)
        ├── src/
        ├── scripts/                     # generate-keys.ts, smoke.ts
        ├── prisma/
        ├── package.json
        ├── railway.json
        ├── .nvmrc                       # 22
        └── STATE.md                     # this file
```

Note the nested `safe-sales-backend\safe-sales-backend\` path — the outer folder is the git checkout, the inner is the actual project (where `package.json` lives). Railway's "Root Directory" setting is `safe-sales-backend` so it builds the inner one.

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

## What's built and verified (Phases 1–7, all complete)

| Phase | Deliverable | Status |
|---|---|---|
| 1 | tsconfig, package.json scripts, `"type": "module"`, .env.example, .gitignore | ✅ |
| 2 | Bootable Fastify server with `/health` + pino logger + Zod env validation + CORS | ✅ verified locally |
| 3 | Prisma schema (Seller, Listing, Order, Dispute, EscrowStatus enum, DisputeStatus enum) | ✅ migration `20260521030741_init` applied to Railway |
| 4 | One-shot Nostr keypair generator (`npm run keys:generate`) | ✅ brand key generated, in `.env` |
| 5 | 13 API routes: sellers (POST/GET), listings (POST/GET/list), orders (POST/GET/list), escrow ship/release/dispute, webhooks/bitnob, dev/simulate-payment | ✅ all typechecked + smoke-tested against real DB |
| 6 | Real Cashu mint + NUT-11 P2PK lock/redeem; Nostr DMs to seller (payment locked) and buyer (shipped); LNURL-pay resolver | ✅ end-to-end live test: wrong key 400, correct key redeems 9444 sats |
| 6.5 | Committed smoke test (`npm run smoke`, `scripts/smoke.ts`) — full 8-step end-to-end verification, parameterized by `SMOKE_BASE_URL` for both local + Railway | ✅ 8/8 green locally on every run |
| 7 | Deploy to Railway with public URL, all env vars set, `/health` serving over HTTPS, `npm run smoke` against the public URL passes 8/8 | ✅ live at `https://safe-sales-backend-production.up.railway.app` |

**Trustless guarantee proven on Railway production** (2026-05-22 04:36 UTC):
- Wrong-key release: `400 BAD_REQUEST "Cashu redeem failed: Witness is missing for p2pk signature"`
- Correct-key release: `redeemedSats: 16666`, order status `completed`

The SafeSale wedge is verified on the live deploy, not just locally.

---

## Phase 7 — what was deployed and what we learned

**Live URL:** `https://safe-sales-backend-production.up.railway.app`
**Health:** `/health` returns `{"ok":true,"service":"safe-sale-backend","env":"production","uptime":N}`

### Files added/changed for Railway

| File | Purpose |
|---|---|
| `scripts/smoke.ts` (new) | 8-step E2E test. `npm run smoke`. Auto-detects production via `/health` and routes Step 4 through `/api/webhooks/bitnob` (since `/api/dev/simulate-payment` is correctly 404'd in prod). |
| `railway.json` (new) | Explicit Nixpacks builder config: build = `npm run build`, start = `npm start`, healthcheck on `/health`, restart ON_FAILURE max 3. |
| `.nvmrc` (new) | `22` — pins Node version for tooling. |
| `package.json` | `engines.node >= 22.0.0`. Moved `@types/node`, `tsx`, `typescript` from `devDependencies` to `dependencies` (Railway build needs them). Pinned `@cashu/cashu-ts` to exact `2.9.0`. `start` now runs `prisma migrate deploy && node dist/src/index.js`. Added `postinstall: prisma generate`. |
| `tsconfig.json` | Added `"types": ["node"]` for explicit Node types resolution. |
| `src/routes/webhooks.ts` | **Important fix:** if `mintLockedToken` throws, propagate as 500 instead of silently advancing order to `payment_locked` without a token. Previous behavior left orders unrecoverable. Now also logs full stack on mint failure. |
| `src/services/cashu.ts` | `waitForQuotePaid` timeout 10s → 30s (Railway cold containers can be slower than local). Added info log when keysets cache populates. |

### The Phase 7 bug hunt (one for the runbook)

The first Railway deploy succeeded but the smoke failed at Step 6/7 with `"Order has no Cashu token"`. After 3 iterations:

1. **First attempt:** longer timeout + propagate mint errors → revealed actual error: `500 INTERNAL_SERVER_ERROR` from cashu mint
2. **Second attempt:** simplified the cashu service to use `loadMint()` → regressed locally with `"Couldn't verify keyset ID..."` (cashu-ts rejects testnut's longer keyset format). Reverted.
3. **Third attempt (the fix):** pinned Node 22 via `engines.node`. Root cause was Railway defaulting to Node 20 LTS when nothing was pinned, while local dev is Node 22. The cashu-ts + testnut keyset path behaves differently between the two Node majors.

**Lesson:** always pin `engines.node` for any project deployed to Nixpacks. Default LTS is a moving target.

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
- `SAFESALE_FEE_LN_ADDRESS` — `egbalajoy@coinos.io` (mainnet LN address; not called until Phase 9 wires fee melt)
- `NOSTR_RELAYS` — `wss://relay.damus.io,wss://nos.lol,wss://relay.primal.net`
- `BITNOB_*` — left empty; mocked for MVP

### Railway-specific notes

- `NODE_ENV=production` is set on Railway (this 404s `/api/dev/simulate-payment` — security)
- `PORT` is **not** set on Railway — Railway injects its own at runtime, our code reads it
- `DATABASE_URL=${{Postgres.DATABASE_URL}}` uses Railway's private network (faster than the public proxy)
- `FRONTEND_ORIGINS=http://localhost:8080,http://localhost:5173` — append the partner's prod frontend URL when it exists

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
- **Recent commits (most recent first):**
  - `e0ded14` fix(deploy): pin Node 22, pin cashu-ts 2.9.0, add keyset diagnostic log
  - `35cfb50` fix(cashu): stop swallowing mint errors; longer Railway-friendly timeout
  - `e82664c` fix(deploy): move @types/node, tsx, typescript to dependencies
  - `403ff2c` chore(deploy): prepare backend for Railway deploy
  - `ab55a43` test(backend): add end-to-end smoke test for full escrow flow
  - `b22b57b` Re Push To avoid conflict (full re-snapshot by user between sessions)
  - `9170ef6` feat(backend): Phase 6 - real Cashu P2PK escrow + Nostr DMs wired into routes
  - `02adda0` chore(db): initial migration (Seller, Listing, Order, Dispute, enums)
  - `77ed872` feat(backend): add API routes
  - `8ada87e` feat(backend): add Prisma schema and DB client
  - `159b402` feat(backend): add Nostr keypair generator
  - `9149145` feat(backend): scaffold Fastify server
  - `75f2396` First Backend Push

---

## What's NEXT (Phase 8 — awaiting user approval)

Phase 7 (Railway deploy) is **done and verified**. The hackathon trajectory from here:

### Phase 8 (next) — Frontend integration with partner's code
The partner's frontend at `safe-sales/` currently reads from `src/lib/mock.ts`. Hand them:
1. **API base URL:** `https://safe-sales-backend-production.up.railway.app`
2. **Frontend `.env` change:** `VITE_API_BASE=https://safe-sales-backend-production.up.railway.app`
3. **Once their prod frontend URL exists** (Vercel/Netlify), add it to the backend's `FRONTEND_ORIGINS` env var on Railway. Currently allows `http://localhost:8080,http://localhost:5173` for partner's dev work.

Backend side of Phase 8 = CORS debugging, response-shape fixes, occasional pair-debugging. The 13 API routes are the contract; see "API surface" section above.

### Phase 9+ (post-MVP, possibly post-hackathon)
- Real Lightning melt on release (99% to seller, 1% to `SAFESALE_FEE_LN_ADDRESS=egbalajoy@coinos.io`) — the comments in `src/routes/escrow.ts:112` mark the exact spot
- Bitnob sandbox integration when API key arrives
- NIP-32 review event publication on completion (helpers exist in `src/services/nostr.ts`)
- Admin dispute resolution UI wiring
- 7-day silent-buyer auto-release background job (cron-like)
- Mainnet ship (switch `CASHU_MINT_URL`, switch `BITNOB_BASE_URL`)

---

## Useful commands

```powershell
# from C:\Users\User\Documents\JOY\Bitcoin\safe-sale-backend\safe-sales-backend\

# Dev server (hot reload)
npm run dev

# Typecheck only
npm run typecheck

# Production build
npm run build

# End-to-end smoke test (server must be running)
npm run smoke
# against Railway:
$env:SMOKE_BASE_URL = "https://safe-sales-backend-production.up.railway.app"; npm run smoke

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
# 1. From safe-sale-backend/safe-sales-backend/
npm install              # in case lockfile changed
npm run typecheck        # should be silent (zero errors)
npm run dev              # server should boot, log "SafeSale backend listening"

# 2. In another terminal, run the smoke test
npm run smoke
# Expect: ALL 8 STEPS PASSED, ~16666 sats redeemed

# 3. Verify Railway is still healthy
curl https://safe-sales-backend-production.up.railway.app/health
# Expect: {"ok":true,"service":"safe-sale-backend","env":"production","uptime":N}

# 4. (Optional) Run the smoke against Railway too
$env:SMOKE_BASE_URL = "https://safe-sales-backend-production.up.railway.app"; npm run smoke
```

---

## Open questions for the user when they return

These will need answers to make smart progress on Phase 8+:

1. **Phase 8 (frontend wiring) approval?** Or pause longer?
2. **Has the partner started wiring the frontend** to the live Railway API? If yes, what works/breaks? Have they set `VITE_API_BASE=https://safe-sales-backend-production.up.railway.app`?
3. **Partner's frontend deployment URL** (Vercel/Netlify/etc.) — needed to add to `FRONTEND_ORIGINS` on Railway so CORS allows it
4. **Any Bitnob sandbox response** from the email sent earlier?
5. **Anything from the demo trial** that surfaced UX issues?

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