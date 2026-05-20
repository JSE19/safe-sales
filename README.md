# SafeSale

> Trustless peer-to-peer commerce for African social-commerce sellers — built on **Nostr** and **Bitcoin (Cashu)**.

SafeSale lets Instagram and WhatsApp sellers accept payments without scams, without bank accounts, and without middlemen. Buyers lock sats in escrow; sellers ship; funds release on confirmation or automatically after a timeout.

Submission for **Hack4Freedom**.

---

## Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS 4** + **shadcn/ui**
- **Nostrify** (`@nostrify/react`) for Nostr identity, relays, and event publishing
- **Cashu** ecash for trustless escrow (in progress)
- **TanStack Query** for data fetching
- **React Router** for client-side routing

## Getting started

```bash
npm install
npm run dev
```

App runs at `http://localhost:8080`.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Produce a production build into `dist/` |
| `npm test` | Type-check, lint, run unit tests, and verify the build |

## Project structure

```
src/
├── components/
│   ├── ui/            # shadcn/ui primitives
│   ├── safesale/      # SafeSale-specific components (Logo, EscrowShield, Timeline, ...)
│   └── auth/          # Nostr login UI
├── pages/             # Marketing, buyer, seller-dashboard pages
├── hooks/             # Nostr + app hooks
├── lib/               # Types, fixtures, utilities
└── contexts/          # React contexts
```

## Branches

- `main` — stable, working baseline
- `frontend` — active frontend work
- `backend` — backend services (TBD)

## Status

This is an in-progress hackathon submission. The current build is a polished UI prototype; the Cashu escrow integration is the next milestone.

## License

MIT
