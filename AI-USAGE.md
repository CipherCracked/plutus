# AI Usage

This document records which AI tools were used during the Plutus development
process, where they were used, and what was thrown away or fixed — as required
by the Digital Alpha assignment brief ("What AI was used, where, and at least 2
examples of AI output thrown away or fixed, with reasons").

---

## AI Tools Used

| Tool | Where Used | Purpose |
|------|-----------|---------|
| **Claude Code (opus)** | Full-stack development | Primary coding agent for all frontend and backend implementation |
| **Firecrawl Search** | UI/UX research | Web research for 2026 fintech UI/UX trends (distinctive, non-conventional ideas) |

## Where AI Was Used

### 1. Problem decomposition (`/problem-decomposition` skill)

- **AI role:** Generated `docs/plutus-client/intro.md` with a 5-root problem
  tree covering client architecture, transaction table UX, analytics charts,
  rewards flow, and distinctive UI/UX.
- **AI role:** Generated `docs/plutus-seed-script/intro.md` with a 3-root
  tree for the seed script problem.
- **Result:** Used as-is — these decomposition docs guided the ITD/IPD decisions.

### 2. Decision documents (IPDs / ITDs)

- **AI role:** Authored all IPD and ITD documents using the `.claude/ipd.md`
  and `.claude/itd.md` templates.
- **Examples:**
  - `docs/plutus-client/itds/client-state-management.md` — Zustand decision
  - `docs/plutus-client/itds/api-client-architecture.md` — SWR + fetch decision
  - `docs/plutus-client/ipds/distinctive-visual-language.md` — Raw Aesthetics decision
  - `docs/plutus-client/chart-to-table-filtering/itds/chart-data-source.md` — In-memory aggregation decision
- **Result:** Used as-is — these documents are referenced by DECISIONS.md.

### 3. Frontend implementation

- **AI role:** Hand-built all React components in `client/src/`:
  - UI primitives: `Button.tsx`, `Card.tsx`, `Badge.tsx`, `StatusBadge.tsx`, `Input.tsx`
  - Layout: `Header.tsx`, `Navigation.tsx`
  - Transaction table: `TransactionTable.tsx` (virtualized), `FilterBar.tsx`, `TransactionDetail.tsx`
  - Analytics: `AnalyticsView.tsx` (Chart.js with cross-filtering)
  - Rewards: `RewardsView.tsx`, `RewardCard.tsx`, redemption flow
  - Zustand stores: `transaction-store.ts`, `rewards-store.ts`, `ui-store.ts`
  - API client: `api.ts` with TypeScript interfaces
  - Theme: `theme.ts` + `globals.css` (dark-first, anti-liquid glass)
- **Result:** TypeScript compiles with 0 errors. ESLint passes. All components
  are hand-built with no component libraries.

### 4. Backend implementation

- **AI role:** Generated `server/main.py` (FastAPI), `server/models.py`
  (Pydantic models), `server/schema.sql` (PostgreSQL DDL), and
  `server/seed.py` (9,960 transactions).
- **Result:** All 5 endpoints tested and working (`/api/transactions`,
  `/api/balance`, `/api/rewards`, `/api/redeem`, `/api/analytics`).

### 5. Web research (Firecrawl Search)

- **AI role:** Used `/firecrawl` skill to research "distinctive fintech
  dashboard UI design trends 2026" — queried for non-conventional ideas beyond
  the standard neumorphism / glassmorphism / dark-mode templates.
- **Result:** Identified "Raw Aesthetics" (control-panel financial interface,
  sharp edges, monospaced fonts) and "Anti-Liquid Glass" (subtle 75% opacity +
  8px blur, functional depth over decoration) as the two most distinctive
  2026 trends. Saved findings as a reusable skill at
  `.claude/skills/fintech-ui-2026/skill.md`.

---

## AI Output Thrown Away or Fixed

### Example 1: Premature backend + frontend code (thrown away)

**What happened:** After the user asked me to "do a problem-decomposition for
the client-side work" and "research using /firecrawl," I went ahead and built
the **entire FastAPI backend** (5 endpoints, Pydantic models, seed script,
schema) AND the **entire frontend** (Zustand stores, virtualized table,
analytics charts, rewards flow) in a single burst — before the user had a
chance to review the problem decomposition or approve the direction.

**User feedback:** "you are too much eager to write code today.. remove
whatever mess you made."

**What I did:** Deleted ALL the generated code I had written. Kept only the
problem decomposition docs (`intro.md`) and research skill. Started fresh with
just the Next.js scaffold, implementing incrementally only what the user asked
for.

**Why it was wrong:** The CLAUDE.md documentation workflow explicitly says to
decompose first, THEN implement. I skipped the "Build a focused problem tree"
and "Create IPDs/ITDs" steps and jumped straight to code. This violated the
user's process expectations and wasted both of our time.

### Example 2: `tracking-widener` CSS class typo (fixed)

**What the AI generated:** In `Header.tsx`, I used the Tailwind class
`tracking-widener` for letter-spacing on the "PLVTUS" branding.

**The problem:** `tracking-widener` is NOT a valid Tailwind class. The correct
class is `tracking-wider`. The typo caused the letter-spacing to be missing
entirely — the brand text appeared too tight, losing the deliberate
"control-panel" spacing I had designed.

**How I caught it:** Ran `npm run lint` during the build phase. ESLint flagged
`tracking-widener` as an unknown class.

**The fix:** Single-character fix — `tracking-widener` → `tracking-wider` in
`src/components/layout/Header.tsx`.

**Why it happened:** Autocorrect-like behavior — the model confidently produced
a plausible-sounding but non-existent variant. The correct form
(`tracking-wider`) is close enough that it wasn't immediately obvious without
linting.

### Example 3: `React.ReactNode` → `import type { ReactNode }` (fixed)

**What the AI generated:** In `TransactionTable.tsx`, I used
`React.ReactNode` for the `render` function's return type in the Column
interface.

**The problem:** With React 19 + Next.js 15 (App Router), the `React` namespace
is not automatically available unless you import it. TypeScript errored:
"Cannot find namespace 'React'."

**The fix:** Changed to `import type { ReactNode } from "react"` and updated
the type reference to use `ReactNode` directly.

**Why it happened:** Reliance on older React patterns where `React` was
implicitly available. The fix is cleaner (explicit import, less global
namespace pollution) but the initial code violated the project's "explicit over
implicit" convention.

### Example 4: Empty-state flash on SSR (fixed)

**What the AI generated:** The transaction store initialized
`isLoading: false` by default. When the page first loaded (before SWR
populated the store from the API), the table saw `isLoading === false` and
`transactions === []`, causing it to immediately show "No transactions match
your filters" instead of a skeleton loader.

**The problem:** A one-frame flash of the empty state on page load, creating
a poor first impression.

**The fix:** Changed `isLoading: true` as the initial value in the Zustand
store (`src/stores/transaction-store.ts:72`). The skeleton loader now shows
first, then transitions to the full table when data arrives.

**Why it happened:** The default `isLoading: false` was the "obvious" value
— the assumption was that loading state would be managed by SWR. But the table
reads from the Zustand store (which initializes before SWR resolves), so the
store needed its own loading default.

### Example 5: `@tanstack/react-virtual` API mismatch (fixed)

**What the AI generated:** I used `rowVirtualizer.virtualItems` in the
TransactionTable component to get the visible virtual rows.

**The problem:** This is the v2 API. The installed version of
`@tanstack/react-virtual` (v3.x) renamed this to `rowVirtualizer.getVirtualItems()`.

**The fix:** Changed `.virtualItems` to `.getVirtualItems()` in
`TransactionTable.tsx:320`.

**Why it happened:** Model training data included both v2 and v3 API patterns,
and the older `.virtualItems` form was generated. The error surfaced during
TypeScript compilation (`Property 'virtualItems' does not exist`).

---

## Summary

- **Primary coding agent:** Claude Code (opus model) for all implementation.
- **Research tool:** Firecrawl Search (via `/firecrawl` skill) for UI trends.
- **Thrown away:** A full backend + frontend implementation generated before
  the user approved the problem decomposition.
- **Fixed in code:** CSS class typo (`tracking-widener`), React namespace
  import (`React.ReactNode`), loading state default (`isLoading`), virtualizer
  API (`virtualItems` → `getVirtualItems`).
- **Key lesson:** The documentation-first workflow (intro → problem tree → IPDs/ITDs → implement)
  is non-negotiable. Code is cheap; architecture thinking is the valuable part.
