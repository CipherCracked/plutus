# Decisions

Important technical choices made during Plutus development, with reasoning
and traceable back to ITDs in `docs/plutus-client/itds/`.

---

## DT 1 — Zustand for client-side state management

**Decision:** Use [Zustand](https://zustand-demo.pmnd.rs/) for all client-side
state instead of React Context, Jotai, or Redux Toolkit.

**Why:** The 10k-row virtualized table is the primary performance concern.
When a filter changes, only the table and charts should re-render — not the
rewards balance or header. Zustand's selector-based subscriptions
(`useTransactionStore(state => state.filters)`) enable fine-grained re-renders.
React Context would re-render ALL consumers on any context change, causing the
virtualized table to re-measure rows unnecessarily on every keystroke in the
search box.

**Tradeoff:** Adds a ~1KB dependency. The performance benefit for a 10k-row
table justifies this.

**Referenced in:** `docs/plutus-client/itds/client-state-management.md`

---

## DT 2 — Native fetch + SWR for API data fetching

**Decision:** Use native `fetch()` wrapped with [SWR](https://swr.vercel.app/)
for cache-and-revalidate behavior, not React Query or hand-rolled hooks.

**Why:** SWR is lightweight (~2KB), zero-config, and integrates naturally with
React hooks. The 4-endpoint API surface is simple enough that SWR's
key-based API (`useSWR('/api/transactions', fetcher)`) is sufficient. React
Query adds ~10KB and API surface (query keys, devtools) that's unnecessary here.

**Tradeoff:** No built-in devtools. The `mutate('/api/balance')` call after
redemption is a manual step — easy to forget, but documented.

**Referenced in:** `docs/plutus-client/itds/api-client-architecture.md`

---

## DT 3 — Client-Side virtualization for 10k rows

**Decision:** Load all 10k transactions in a single API call and use
`@tanstack/react-virtual` for rendering, not server-side pagination.

**Why:** Server-side pagination (e.g., 50 rows per page) would require a filter
bar that triggers API calls on every keystroke in the search box — 100ms+
round-trip per interaction. With all 10k rows cached client-side, the
`getFiltered()` method on the Zustand store returns filtered results in <5ms,
enabling instant search-as-you-type. Virtualization renders only ~20 visible
rows, so DOM performance is not a concern.

**Tradeoff:** The full dataset (~5-8MB JSON) is loaded into memory on first
page load. For datasets beyond ~50k rows, server-side pagination would be
necessary.

**Referenced in:** `docs/plutus-client/itds/client-state-management.md`

---

## DT 4 — In-memory chart aggregation (chart-to-table cross-filtering)

**Decision:** Compute chart data (category breakdown, monthly trend) from the
in-memory `transactions` array via `getFiltered()`, not from the
`/api/analytics` backend endpoint.

**Why:** Click-to-filter requires charts to reflect the same filtered subset
as the table. If charts came from the API (pre-aggregated over ALL
transactions), they'd be disconnected from the table's filter state. By
aggregating in memory from the same array, the charts and table are always
in sync — a bar click sets a filter on Zustand, which re-renders both views.
The ~1-2ms cost for aggregating 10k rows in JavaScript is negligible.

**Tradeoff:** Loses SQL-side optimization (indexed GROUP BY). Irrelevant at
10k rows.

**Referenced in:** `docs/plutus-client/chart-to-table-filtering/itds/chart-data-source.md`

---

## DT 5 — Chart.js (not Recharts) for charts

**Decision:** Use [Chart.js 4](https://www.chartjs.org/) with
`react-chartjs-2`, not Recharts or D3.

**Why:** Chart.js has a mature, well-documented API with fine-grained control
over bar styling, tooltips, and click handlers — needed for the
cross-filtering interaction. Recharts wraps Chart.js and abstracts away
customization, making it harder to implement sharp-edge styling and
per-bar click handlers. D3 is overkill — we need bar and line charts, not
custom data visualizations.

**Tradeoff:** Chart.js v4 API differs from v3 (`getVirtualItems()` is now
`virtualItems` in react-virtual). The `onClick` handler requires casting
the elements parameter.

**Not in ITD** — decided pragmatically; the `plutus-client/intro.md` open
question listed this as "Chart.js vs Recharts" and Chart.js was chosen for
its lower-level control surface.

---

## DT 6 — Sharp-edged "raw aesthetics" UI

**Decision:** Use sharp edges (border-radius: 0 or 2px), monospaced financial
data, dark-first design, and subtle anti-liquid glass surfaces (75% opacity +
8px blur), not rounded cards or conventional financial dashboard templates.

**Why:** The firecrawl research (TubikStudio 2026 UI trends) identifies
"raw aesthetics" and "anti-liquid glass" as the two most distinctive trends for
2026. This aligns with the assignment's explicit requirement for
"distinctive, non-conventional UI/UX" and the 72% frontend evaluation weight.
Monospaced fonts for amounts/timestamp improve scanability for financial data.

**Tradeoff:** Anti-liquid glass requires careful tuning of opacity, blur, and
shadow — incorrect values make the UI look broken rather than sophisticated.

**Referenced in:**
- `docs/plutus-client/ipds/distinctive-visual-language.md`
- `.claude/skills/fintech-ui-2026/skill.md`

---

## DT 7 — PostgreSQL schema design (flat transactions + separate coins table)

**Decision:** Store transactions in a single flat `transactions` table with
denormalized category and payment_method as TEXT columns. Store the coin
balance in a separate `coins_balance` table (id, balance, total_earned,
total_redeemed).

**Why:** The dataset is a single-user demo — normalization beyond a basic
split between transactional data (transactions) and aggregate state (coins
balance) adds complexity without benefit. A flat table avoids JOIN overhead
on the 10k-row read path. The coins_balance table is separate because it
persists across redemptions and needs atomic updates (deduct coins on
redeem).

**Tradeoff:** Denormalized category/payment_method means no referential
integrity for these fields. Acceptable for a static seeded dataset — they're
treated as string values, not foreign keys.

**Referenced in:** `docs/plutus/itds/postgresql-schema.md`

---

## DT 8 — Atomic redemption on the backend

**Decision:** The `POST /api/redeem` endpoint performs an atomic
verify→check→deduct→log operation inside a single database transaction.
Returns 402 Payment Required if the balance is insufficient.

**Why:** Two concurrent redemption requests could read the same balance,
both pass the check, and both deduct — resulting in a negative balance.
A database transaction with row-level locking prevents this. Returning
HTTP 402 (the canonical "payment required" status) gives the frontend a
specific status code to handle for insufficient-balance errors, distinct
from 400 Bad Request (invalid reward ID) and 404 Not Found (reward doesn't
exist).

**Tradeoff:** The frontend must handle 402 specifically in its error path.
The `redeemReward()` function in `src/lib/api.ts` already maps any non-2xx
response to a thrown Error with the detail string.

**Referenced in:** `docs/plutus/itds/postgresql-schema.md` (atomic transaction section)

---

## DT 9 — No component libraries (hand-built UI)

**Decision:** All UI components (Table, Button, Card, Badge, Input, Modal)
are hand-built with vanilla HTML + CSS + Tailwind. No MUI, Ant Design,
Chakra, or shadcn.

**Why:** The assignment explicitly prohibits component libraries. Beyond the
constraint, hand-built components give full control over the distinctive
"raw aesthetics" visual language — no abstraction leaking conventional
rounded-card defaults.

**Tradeoff:** No battle-tested accessibility features (ARIA, keyboard
navigation) out of the box. Keyboard navigation is mouse-only at this stage;
documented as a known issue in README.md.

**Referenced in:** `docs/plutus-client/intro.md` (constraints section)

---

## DT 10 — Focus states via CSS :focus-visible (keyboard accessibility)

**Decision:** Add `focus-visible` ring styles to all interactive elements —
table row buttons, header sort buttons, reward cards, filter dropdowns.

**Why:** The assignment lists "focus states" as a required table constraint.
CSS `:focus-visible` provides keyboard-accessible focus indicators without
the "click ring" that annoys mouse users.

**Tradeoff:** Focus ring styling in a "raw aesthetics" design requires
deliberate contrast against the dark background. Using `ring-2 ring-accent`
maintains visual consistency with the gold accent color scheme.

**Not in ITD** — tactical CSS decision, implemented directly in component
classes rather than documented as a full ITD (it's a styling constraint,
not an architectural choice).
