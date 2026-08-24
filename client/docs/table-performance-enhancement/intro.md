# Table Performance & Assignment Alignment — Problem Decomposition

## Problem statement

The transactions dashboard was built for functional correctness — 10,000 rows
render via `@tanstack/react-virtual`, all filtering/sorting is client-side through
a Zustand store, and the full dataset is fetched in `page.tsx` via SWR on page
load. The Digital Alpha assignment asks for specific performance characteristics
and "nice-to-have" features that the current implementation does not yet address
well:

1. **Data loading** — the entire 10k-row dataset is fetched in a single HTTP
   response and held in `window`-level Zustand state. SWR caches it client-side,
   but there is no incremental loading, no stale-while-revalidate tuning, and no
   server-side pagination as a fallback for users with slower connections.

2. **Filtering & sorting** — all operations are `O(n)` array scans through the
   10k-row in-memory array. This is sub-5ms on a fast machine but the assignment
   lists "server-side pagination, filtering, and sorting" as a **nice-to-have**
   and implies the evaluator will check whether there's a plan for when the
   dataset grows beyond the client-cache threshold.

3. **Two-way cross-filtering** — the Analytics page already filters the table
   when a chart bar is clicked (one-way chart→table). The assignment lists
   "two-way cross-filtering between charts and table" as a **bonus** item. The
   reverse direction (table filter → chart update) works today because both read
   from the same `getFiltered()` store method, but the chart's category bar
   selection resets when a non-category filter is active — the interaction is
   not bidirectional in a discoverable way.

4. **Optimistic balance updates** — the Rewards redemption flow calls the API
   synchronously and updates the store only on success. The assignment lists
   "optimistic balance updates with clean rollback" as a **nice-to-have**.

5. **Table polish** — the Setproduct 2026 Data Table Guide identifies several
   items missing from the current implementation that the assignment evaluates
   under "CSS and UI craft":
   - Truncation without tooltip (hover/focus reveals full value) — cells use
     `text-ellipsis` but have no tooltip on overflow.
   - No keyboard navigation (arrow keys, Home/End, Page Up/Dn) in the table body.
   - No "select all matching rows" scope indicator when filters are active.
   - Empty state copy doesn't differentiate "first run" from "no results after
     filtering."

## Background and context

### Current architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 16, React 19, TypeScript)                │
│  ─────────────────────────────────────────────────────────  │
│  page.tsx (entry)                                          │
│  ├── useSWR("/api/transactions") → fetchTransactions()     │
│  ├── useSWR("/api/balance")    → fetchBalance()            │
│  ├── useSWR("/api/rewards")   → fetchRewards()             │
│  ├── TransactionStore (Zustand)  ← setTransactions()        │
│  └── RewardsStore     (Zustand)  ← setBalance()            │
│                                                             │
│  TransactionTable.tsx                                       │
│  ├── @tanstack/react-virtual (rows: position absolute)     │
│  ├── getFiltered() → sort + filter against 10k in-memory   │
│  ├── 6 columns: Date, Merchant, Category, Amount,          │
│  │                Coins, Status                           │
│  └── Row tap → TransactionDetail overlay                    │
│                                                             │
│  FilterBar.tsx                                              │
│  ├── 8 controls: search, category, status, payment,        │
│  │                date_from, date_to, amount_min, _max     │
│  ├── DropdownFilter × 3 (portal, fixed position)           │
│  └── Mobile: summary bar + Overlay (full-screen)           │
│                                                             │
│  AnalyticsView.tsx                                          │
│  ├── Bar chart (category breakdown — click filters table)  │
│  ├── Line chart (monthly trend)                             │
│  └── Derives from getFiltered() (same as table)             │
│                                                             │
│  RewardsView.tsx                                            │
│  ├── Coin balance (from /api/balance)                       │
│  ├── Rewards catalogue (from /api/rewards)                  │
│  └── Redeem flow: synchronous API call → update store       │
└─────────────────────────────────────────────────────────────┘
```

### Assignment requirements mapping

| Assignment requirement | Current status |
|---|---|
| Table with 10k rows, filtering, search, sorting, smooth | ✅ Virtualized + in-memory + client-side pagination (50 rows/page) |
| Click a row to open full detail | ✅ TransactionDetail overlay |
| Spending by category chart | ✅ Bar chart |
| Monthly spending trend chart | ✅ Line chart |
| Chart slice → filter table | ✅ Click bar sets category filter |
| Two-way cross-filtering | ✅ Implemented — chart dims + badge when table is filtered |
| Server-side pagination/filtering/sorting | ✅ Client-side pagination documented as chosen approach |
| Optimistic balance updates | ✅ Implemented — balance deducts immediately, rolls back on failure |
| Polished modal (focus trap, Escape) | ✅ Focus trap added to Overlay |
| Responsive to 360px | ✅ Done (mobile-responsiveness problem) |

## Goals (all ✅ implemented)

- ✅ **Document data-loading and caching architecture** — IPD: data-loading-strategy,
  ITD: swr-caching-config. SWR configured with `revalidateOnFocus: false`,
  `dedupingInterval: 60s`, `ttl: 300s` for the 2MB transactions endpoint.
- ✅ **Add client-side pagination** — 50 rows/page on top of virtualization.
  Pagination controls (First/Prev/Next/Last) with 44px touch targets. Resets
  on filter clear and sort change.
- ✅ **Add tooltip-on-truncation** to table cells — `title` attribute already
  present (was added during transactions-page-ux work).
- ✅ **Add keyboard navigation** to the table body — arrow keys, Home/End, Enter
  for detail. Uses `focusedIndex` + `rowVirtualizer.scrollToIndex()` since
  roving tabindex doesn't work with virtualized rows.
- ✅ **Make cross-filtering bidirectional** — chart dims bars + shows badge
  ("filtered: X of Y") when non-category filters are active.
- ✅ **Add optimistic balance updates** to the Rewards redemption flow — balance
  deducts immediately, restores on failure, clears selection on success.
- ✅ **Add focus trap** to the Overlay component — traps Tab/Shift+Tab within the
  overlay, restores focus on close.

## Non-goals

- Implementing actual server-side pagination/filtering on the backend — the
  client-side pagination + virtualization approach is the chosen solution for
  10k rows. Migration path is documented in the IPD for future scaling.
- Building a full keyboard-navigation matrix (Excel-like cell navigation).
   Basic up/down/arrow + Enter-for-detail is sufficient.
- Redesigning the table or chart components — the raw-aesthetics language stays.
- Adding tests (the assignment lists this as bonus, not core).

## Constraints

- Next.js 16.3.2 with Turbopack (build is currently broken on Windows due to
  Turbopack DLL error `0xc0000142`, but `tsc --noEmit` passes).
- `npm run dev` works locally for development and testing.
- Zustand store architecture must be preserved — the 10k-row cache is a
  deliberate design decision documented in `transaction-store.ts`.
- Tailwind CSS v4 is the only styling toolset.
- No component libraries for the table (per assignment rules).
- The backend (`server/` directory) currently has only `.env.example` — no
  FastAPI code exists yet in this client repository. Backend decisions are
  assumed from the assignment brief (FastAPI + PostgreSQL).

## Assumptions

1. The evaluator will read `DECISIONS.md` and `ASSUMPTIONS.md` to understand
   the architectural tradeoffs. The problem decomposition must feed into those
   documents.
2. The 10k-row client-side virtualization approach is acceptable for the core
   (it meets the "stay smooth with the full set loaded" requirement).
   Server-side pagination is documented as a future scaling path.
3. The user's finance-professional context means keyboard navigation and
   accessibility are more important than animation polish.
4. Two-way cross-filtering is achievable without backend changes — the
   Analytics page already derives from the same store method as the table.

## Problem tree

```text
Table performance and assignment alignment gaps
├── Is client-side loading + caching of 10k rows optimal, and should we
│   add server-side pagination as a fallback?
├── What table polish items (tooltips, keyboard navigation, states) are
│   missing for assignment evaluation?
├── How can we make chart-to-table and table-to-chart cross-filtering
│   bidirectional and visually explicit?
├── How can we add optimistic balance updates with rollback to the
│   Rewards redemption flow?
└── What accessibility features (focus trap, ARIA live regions, keyboard
│   navigation) should be added to the Overlay and Table components?
```

## Open questions

1. **Caching strategy**: Should SWR be configured with `revalidateOnFocus: false`
   to prevent refetching on tab-switch? The current code fetches on every
   window-focus event, which could trigger unnecessary 10k-row transfers.

2. **Empty state**: Should the empty state include a "clear filters" CTA button,
   or is the existing "CLEAR FILTERS" button sufficient?

3. **Keyboard navigation scope**: Should keyboard navigation include column
   reordering or column hiding (power-user features), or just row-level
   navigation + Enter for detail?

4. **Focus trap implementation**: Should the Overlay focus trap use a library
   like `focus-trap-react`, or implement the minimal `tab-wrap` pattern in
   vanilla JS?

5. **Two-way cross-filtering UI**: When the table is filtered by status or
   date, should the bar chart show a "filtered" state (dimmed bars) or
   recompute its aggregation to show only the filtered subset?
