# Plutus — Credit Card Bill Payment & Rewards

A consumer-facing credit-card bill payment and rewards application. Users pay credit-card bills, earn reward coins on payments (1 coin per ₹100 spent, capped per transaction), and view their spending through a transactions dashboard and analytics.

Built as a 24-hour take-home assignment for Digital Alpha Technologies.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript |
| State | Zustand (transaction, rewards, UI stores) |
| Data Fetching | SWR (stale-while-revalidate) + native fetch |
| Virtualization | @tanstack/react-virtual (10k-row table) |
| Charts | Chart.js 4 + react-chartjs-2 |
| Backend | Python + FastAPI |
| Database | PostgreSQL (via Supabase) |
| Styling | Tailwind CSS v4 (hand-built, no component libs) |

## Local Setup (< 5 minutes)

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL connection (Supabase free tier or local Postgres)

### 1. Clone and install frontend dependencies
```bash
cd client
npm install
```

### 2. Configure environment
Create `client/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Configure backend
Create `.env` at project root:
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

### 4. Install Python dependencies
```bash
cd server
pip install -r requirements.txt
```

### 5. Seed the database (one command)
```bash
cd server
python seed.py
```

### 6. Run both servers
```bash
# Terminal 1 — Backend
cd server
uvicorn main:app --host 0.0.0.0 --port 8000

# Terminal 2 — Frontend
cd client
npm run dev
```

Visit http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | All 10,000 transactions |
| GET | `/api/balance` | User's coin balance + stats |
| GET | `/api/rewards` | Rewards catalogue (4–6 items) |
| POST | `/api/redeem` | Redeem a reward (atomic) |
| GET | `/api/analytics` | Category breakdown + monthly trend |

## Done

- ✅ 10k-row virtualized transaction table (scrolls smoothly, no pagination)
- ✅ Filter by category, date range, amount range, payment status, merchant search
- ✅ Sort by date, amount, merchant, category (click column header to cycle)
- ✅ Row click opens detail drawer with full transaction info
- ✅ Sticky table header, hover states, loading skeletons, empty state, error state
- ✅ Spend analytics: category breakdown (bar) + monthly trend (line) charts
- ✅ Chart-to-table cross-filtering (click a bar to filter the table)
- ✅ Rewards system: coin balance, rewards catalogue, redemption flow
- ✅ Coin formula: min(floor(amount/100), 50) for SUCCESS transactions only
- ✅ Backend rejects invalid/unaffordable redemptions (proper HTTP status codes)
- ✅ PostgreSQL with relational schema (flat transactions + coins_balance)
- ✅ One-command seed (`python seed.py`)
- ✅ Distinctive UI: Raw Aesthetics (sharp edges, monospaced, gold accents, anti-liquid glass)
- ✅ Dark-mode-first, responsive down to 360px
- ✅ TypeScript + ESLint clean (0 errors)
- ✅ Commit history with meaningful messages

## Not Done

- ❌ Deployment (Vercel + Render + Supabase) — running locally only
- ❌ Demo video (optional, deployment not required for review)
- ❌ Server-side pagination/filtering (using client-side caching instead)
- ❌ Two-way chart-to-everything filtering (charts are driven by table filters,
  but table filters don't reshape the charts beyond showing the aggregated subset)
- ❌ Optimistic balance updates (balance updates after API confirms)
- ❌ Focus trap in the detail drawer (Escape to close is supported)
- ❌ Automated tests

## Known Issues

- The `useVirtualizer` from @tanstack/react-virtual triggers a React Compiler
  warning about incompatible library functions. This is a known issue with the
  library and doesn't affect functionality.
- Initial data fetch loads all 10k rows into memory (~5-8MB). For this dataset
  size it's fine, but wouldn't scale beyond ~50k rows without server-side
  pagination.
- Light mode is functional but the visual language is designed for dark mode;
  light mode is a secondary consideration.
- No keyboard navigation (arrow keys, Enter to open detail) — mouse-only at this stage.

## Project Structure
```
plutus/
├── client/                  # Frontend (Next.js + TypeScript + Tailwind)
│   ├── src/
│   │   ├── app/             # Pages, layout, global CSS
│   │   ├── components/      # UI components
│   │   │   ├── transactions/  # Table, filters, detail drawer
│   │   │   ├── analytics/    # Chart view
│   │   │   ├── rewards/      # Rewards catalogue + redemption
│   │   │   ├── layout/       # Header, navigation
│   │   │   └── ui/           # Button, Card, Badge, Input, StatusBadge
│   │   ├── lib/            # API client, design tokens
│   │   └── stores/         # Zustand state stores
│   └── package.json
├── server/                  # Backend (FastAPI + Python)
│   ├── main.py              # 5 API endpoints + CORS
│   ├── models.py            # Pydantic models
│   ├── schema.sql           # PostgreSQL schema
│   ├── seed.py              # One-command data loader
│   └── requirements.txt
├── docs/plutus/            # Problem decomposition (intro, IPDs, ITDs)
├── .claude/skills/         # Reusable skills (fintech UI 2026)
└── Digital_Alpha_Assignment.md  # Original assignment brief
```
