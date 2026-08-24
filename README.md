# Plutus — Credit-Card Bills, Rewards Coins, Spend Insights

A consumer app for paying credit-card bills, earning reward coins on payments (1 coin per ₹100 spent, capped at 50 per transaction), and understanding your own spending through a filterable transactions dashboard and spend analytics.

Built as a 24-hour take-home assignment for Digital Alpha Technologies.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 — hand-built components, **no component library for the table** |
| State | Zustand 5 (transactions, rewards, UI stores) |
| Data fetching | SWR + native fetch |
| Table rendering | @tanstack/react-virtual + client-side pagination |
| Charts | Chart.js 4 + react-chartjs-2 (+ datalabels & annotation plugins) |
| Backend | Python + FastAPI + Pydantic v2 + psycopg2 |
| Database | PostgreSQL (hosted on Supabase free tier) |

## Local Setup (< 5 minutes)

### Prerequisites
- Node.js 18+
- Python 3.10+
- A PostgreSQL database (Supabase free tier works; any Postgres 16+ connection string does)

### 1. Install frontend dependencies
```bash
cd client
npm install
```

### 2. Configure the backend connection
Create a `.env` file at the **project root** (or in `server/`) — see `server/.env.example`:
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```
The frontend needs nothing — `client/src/lib/api.ts` defaults to `http://localhost:8000`; override with `NEXT_PUBLIC_API_URL` in `client/.env.local` if you host the API elsewhere.

### 3. Install Python dependencies
```bash
cd server
pip install -r requirements.txt
```

### 4. Seed the database (one command)
```bash
python seed.py
```
The dataset (`transactions.json`, 10,000 records) is committed at the repo root — nothing else to download. The script is idempotent: it drops and recreates the schema, then loads the normalized data. Expected output:

| Metric | Value |
|---|---|
| Records processed | 10,000 |
| Rows loaded | 9,960 (40 duplicate IDs skipped) |
| Bad timestamps / amounts | 0 |
| Default user coin balance | 256,415 |
| Rewards seeded | 6 |

### 5. Run both servers
```bash
# Terminal 1 — backend
cd server
uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2 — frontend
cd client
npm run dev
```

Open http://localhost:3000

## API

Base URL: `http://localhost:8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | All 9,960 transactions (loaded once, cached client-side) |
| GET | `/api/balance` | Coin balance + lifetime earned/redeemed stats |
| GET | `/api/rewards` | Rewards catalogue (6 items) |
| POST | `/api/redeem` | Redeem a reward atomically. `404` unknown reward · `402` insufficient balance |
| GET | `/api/analytics` | Pre-aggregated category breakdown + monthly trend |

Schema: see `server/schema.sql` — 4 tables (`users`, `transactions`, `rewards`, `redemptions`), indexed on every filter/sort column plus a `pg_trgm` GIN index on merchant name.

## Live URLs

| | URL |
|---|---|
| Frontend (Next.js on Vercel) | **https://plutus-drab.vercel.app** |
| API (FastAPI on Render free tier) | https://plutus-qpi2.onrender.com |

Note: the Render free tier sleeps after inactivity — the first request after a idle period can take ~30–60 s while the service wakes up. No demo video; this README + the commit history are the walkthrough.

## Done

- ✅ 10k-row table: virtualized (~20 DOM rows) **and** client-side paginated (50/page) — smooth scroll, instant search-as-you-type
- ✅ Filters: category, date range, amount range, payment status — freely combinable, plus merchant search
- ✅ Sorting by date / amount / merchant / category (click header cycles asc → desc)
- ✅ Row detail: slide-over panel on desktop, full-screen overlay on mobile
- ✅ Table states: sticky header, hover, keyboard focus rings, skeleton loading, empty vs. no-results, error
- ✅ Analytics: category breakdown (bar) + monthly trend (line, with average reference line)
- ✅ Two-way cross-filtering: clicking a bar filters the table; table filters reshape the charts (dimmed bars + "filtered" badge when non-category filters are active)
- ✅ Rewards: balance always visible, 6-item catalogue, Select → Confirm → Done flow
- ✅ Optimistic balance update with clean rollback when redemption fails
- ✅ Backend rejects invalid/unaffordable redemptions with proper status codes (404 / 402), atomic deduct + log in a single transaction
- ✅ PostgreSQL schema + one-command idempotent seed of the provided dataset
- ✅ Distinctive UI: dark-first "raw aesthetics" — sharp edges, monospaced financial figures, gold accent, anti-liquid-glass surfaces
- ✅ Responsive down to 360px: bottom-sheet filter overlay, frozen first table column, 44px touch targets
- ✅ Keyboard support: arrow keys / Home / End walk rows, Enter opens detail, Escape closes overlays; ARIA live region announces result counts
- ✅ TypeScript and ESLint pass with 0 errors
- ✅ Deployed: frontend on Vercel, API on Render free tier, PostgreSQL on Supabase

## Not Done

- ❌ Demo video (deployment is done — see Live URLs above; the video isn't)
- ❌ Automated tests (the brief lists them as genuinely optional; none written)
- ❌ Server-side pagination / filtering / sorting — deliberately declined, see `DECISIONS.md` DT3
- ❌ Focus trap + Escape handling on the **desktop** slide-over panel (the mobile overlay has both)
- ❌ Light mode receives minimal polish — it's a token swap driven by system preference, not a designed second theme

## Known Issues

- `npm run build` fails on the development machine used to build this (Turbopack PostCSS worker exits with `0xc0000142` on Windows). Verified pre-existing on a clean checkout — `next dev` runs the app fine.
- The full dataset ships to the browser once (~2 MB JSON). Fine at 10k rows; past ~50k you'd want the server-side route we consciously skipped.
- Redemption atomicity comes from running check-deduct-log in one database transaction. It does not take a row lock (`SELECT … FOR UPDATE`) — correct for a single-user demo, not for concurrent multi-user writes.
- CORS is a strict origin allowlist, not `*`: the backend serves only the deployed frontend (`https://plutus-drab.vercel.app`) plus local dev origins. Overridable via its `ALLOWED_ORIGINS` env var (comma-separated) — set it if the frontend ever moves to a new origin.
- One pre-existing ESLint warning from `@tanstack/react-virtual` (React Compiler compatibility note); harmless.

## Project Structure

```
plutus/
├── client/                     # Next.js frontend
│   └── src/
│       ├── app/                # Layout, page shell, global CSS (theme tokens)
│       ├── components/
│       │   ├── transactions/   # Table, FilterBar, detail panel
│       │   ├── analytics/      # Charts view
│       │   ├── rewards/        # Catalogue + redemption flow
│       │   ├── layout/         # Header, Navigation
│       │   └── ui/             # Button, Card, Badge, Input, Overlay, Logo…
│       ├── hooks/              # useMediaQuery, useDropdown
│       ├── lib/                # API client, TypeScript types
│       └── stores/             # Zustand stores
├── server/
│   ├── main.py                 # FastAPI endpoints
│   ├── models.py               # Pydantic response/request models
│   ├── schema.sql              # PostgreSQL DDL (tables + indexes)
│   ├── seed.py                 # One-command loader (normalizes the raw JSON)
│   └── requirements.txt
├── docs/                       # Problem decompositions, IPDs, ITDs per feature
├── transactions.json           # Provided dataset (committed)
├── AI-USAGE.md / ASSUMPTIONS.md / DECISIONS.md
└── Digital_Alpha_Assignment.md # Original brief
```
