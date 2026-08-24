# Decisions

Important technical choices, each with the reasoning behind it. Full option-by-option analysis lives in the ITDs referenced per decision.

---

## DT 1 — Zustand for client state

**Decision:** [Zustand](https://github.com/pmndrs/zustand) over React Context, Jotai, or Redux Toolkit.

**Why:** The 10k-row table is the performance-critical surface. Filter keystrokes must re-render only the table and charts — not the balance header or rewards view. Zustand's selector subscriptions give that granularity; a Context would re-render every consumer (including the virtualizer) on each keystroke.

**Tradeoff:** One more ~1KB dependency; state now lives in two places (see DT 11).

**Ref:** `docs/plutus-client/itds/client-state-management.md`

---

## DT 2 — Native fetch wrapped in SWR

**Decision:** SWR + plain `fetch`, not React Query or hand-rolled caching.

**Why:** Four GET endpoints don't justify React Query's API surface. SWR gives stale-while-revalidate for free. Configured with `revalidateOnFocus: false` and a dedup interval so the 2 MB transactions payload isn't refetched on every tab focus.

**Tradeoff:** Cache mutation (`mutate`) after redemption is manual — which is exactly how DT 11's bug was born.

**Ref:** `docs/plutus-client/itds/api-client-architecture.md`, `docs/table-performance-enhancement/itds/swr-caching-config.md`

---

## DT 3 — Virtualization **plus** client-side pagination (server-side pagination declined)

**Decision:** Load all 10k rows in one request, filter/sort in memory, paginate to 50 rows per page, and virtualize the visible page with @tanstack/react-virtual.

**Why:** Two user-visible requirements pulled against each other:
- Instant search-as-you-type needs the dataset client-side; a server round-trip per keystroke would feel sluggish.
- Pure infinite virtual scroll over 10k rows was rejected in review — "scrolling practically infinitely" is unusable for browsing even when technically smooth.

Pagination over the filtered set solves the browsing problem without giving up instant filtering. Charts deliberately keep using the *full* filtered set, not the current page. Server-side pagination/filtering (the brief's "stronger approach") was consciously declined: at 10k rows / single user it adds latency and complexity for zero benefit. It becomes the right answer past roughly 50k rows.

**Tradeoff:** ~2 MB initial transfer; memory grows linearly with dataset size.

**Ref:** `docs/plutus/ipds/transaction-table-ux.md`, `docs/table-performance-enhancement/ipds/data-loading-strategy.md`

---

## DT 4 — In-memory chart aggregation

**Decision:** Charts compute from the same filtered in-memory array as the table, not from `/api/analytics`.

**Why:** Cross-filtering requires both views to reflect one dataset. SQL-side GROUP BY wins nothing at this scale (~1–2 ms in JS) and would decouple the charts from filter state.

**Tradeoff:** The backend analytics endpoint exists but sits unused on the main path.

**Ref:** `docs/plutus-client/chart-to-table-filtering/itds/chart-data-source.md`

---

## DT 5 — Chart.js over Recharts/D3

**Decision:** Chart.js 4 via react-chartjs-2, plus the official datalabels and annotation plugins.

**Why:** Per-bar click handlers, sharp-edge styling, and reference-line annotations needed low-level access Recharts abstracts away; D3 is overkill for two standard charts.

**Gotcha learned the hard way:** registering a plugin via `ChartJS.register()` enables it **globally** — datalabels had to be explicitly disabled on the line chart after figures started overflowing every trend point.

**Ref:** `docs/table-and-website-visual-enhancement/itds/chart-enhancement.md`

---

## DT 6 — "Raw aesthetics" visual language, dark-first

**Decision:** Sharp edges (0–2px radii), monospaced financial figures, true-black background (#0a0a0a) with a gold (#d4af37) accent used only for state/coins, subtle "anti-liquid glass" surfaces (75% opacity + 8px blur), solid-black header band above the glass navigation.

**Why:** Grounded in 2026 fintech UI research (saved as a reusable design skill during this project). Color encodes meaning only — success/failed/pending/gold coins — never decoration; that constraint is what keeps a dense 10k-row table scannable.

**Tradeoff:** Glass surfaces need careful tuning; wrong opacity reads as broken rather than layered.

**Ref:** `docs/plutus-client/ipds/distinctive-visual-language.md`, `docs/table-and-website-visual-enhancement/`

---

## DT 7 — Flat transaction table + separate coin-balance row

**Decision:** `transactions` holds denormalized category/payment_method/status as TEXT; aggregate wallet state lives in `users.coin_balance`; redemptions are their own ledger table.

**Why:** No JOINs on the hot read path; the wallet must update atomically on redeem (DT 8), which favours a single row; `redemptions` preserves an audit trail so lifetime stats survive balance changes. Indexed on every filtered/sorted column plus a `pg_trgm` GIN index on merchant — provisioned for the server-side search we'd add if scale demanded it.

**Tradeoff:** No referential integrity on category strings; acceptable for a seeded demo dataset.

**Ref:** `docs/plutus/itds/postgresql-schema.md`

---

## DT 8 — Atomic redemption in one database transaction

**Decision:** `POST /api/redeem` performs lookup → sufficiency check → deduct → ledger insert inside a single connection context that commits on success and rolls back everything on any failure. Errors use distinct codes: `404` unknown reward, `402` insufficient balance (researched via MDN — reserved but the accepted payment semantic), `500` unseeded database.

**Why:** All-or-nothing means no deduction can ever be logged without its redemption record (or vice versa). A connection-scoped commit/rollback also removed an earlier redundant explicit `commit()` found during review.

**Deliberate omission:** no `SELECT … FOR UPDATE`; concurrent multi-user redemption wasn't in scope (see ASSUMPTIONS #7).

**Ref:** `docs/plutus-backend/itds/atomic-redemption.md`, `docs/plutus-backend/ipds/redemption-error-handling.md`

---

## DT 9 — Hand-built UI components

**Decision:** Table, buttons, cards, badges, inputs, overlay — all hand-built on Tailwind tokens. No MUI/Ant/Chakra/shadcn anywhere (the brief forbids them for the table; we extended the rule everywhere).

**Why:** Consistency with the raw-aesthetics language — library defaults leak conventional rounded-card styling — and full control over interaction states (hover/focus/loading/empty/error) the brief grades closely.

**Ref:** `docs/plutus-client/intro.md`

---

## DT 10 — Keyboard navigation and announced state

**Decision:** Rows are focusable buttons: ↑/↓ move, Home/End jump, Enter opens detail, focus auto-scrolls via the virtualizer; result counts are mirrored into an ARIA live region; interactive elements use `:focus-visible` rings so mouse users never see click outlines.

**Why:** A virtualized table breaks naive tab order (only ~20 rows exist in the DOM); index-based navigation plus `scrollToIndex` makes keyboard traversal work across all 10k rows.

**Ref:** `docs/table-performance-enhancement/itds/table-keyboard-navigation.md`

---

## DT 11 — Write-through both caches on mutation

**Decision:** Any mutation that changes server state (redemption) fetches the authoritative response and writes it through **both** layers: the Zustand store *and* the SWR cache (`mutate(key, data, { revalidate: false })`).

**Why:** State flows one way on read: SWR cache → store (page.tsx syncs on every refetch). An optimistic update that writes only the store gets silently resurrected to pre-redeem values by that sync — shipped as a real bug ("redeem requires a reload"), fixed by making the write-through contract explicit.

**Lesson:** optimistic UI is fine; optimistic UI with two caches needs a documented ownership rule.

**Ref:** `docs/table-performance-enhancement/itds/optimistic-balance-update.md`

---

## DT 12 — Responsive strategy: bottom sheet + frozen first column

**Decision:** Below 640px the filter grid becomes a bottom-sheet overlay (sticky Apply/Clear footer), the detail panel becomes a full-screen overlay with focus trap, touch targets grow to 44px (mobile only, via responsive classes), and the table scrolls horizontally behind a sticky first column with opaque background.

**Why:** At 360px the inline filter grid consumed ~40% of the viewport leaving five visible rows; media-query-driven component swaps preserve the desktop layout instead of compromising both. SSR safety required deferring `matchMedia` reads until after mount to avoid hydration mismatches.

**Tradeoff:** Frozen column stays visually flat (opaque, no zebra bleed-through) by design — content must never show through during horizontal scroll.

**Ref:** `docs/mobile-responsiveness/`
