## Problem to solve

The Digital Alpha assignment lists "two-way cross-filtering between charts and
table" as a **bonus** item. The current Analytics page already has one-way
chart-to-table filtering: clicking a bar in the "Spend by Category" chart calls
`setFilters({ category: [clickedCategory] })`, which updates the Zustand store,
which causes both the chart and table to recompute from `getFiltered()`.

However, the reverse direction (table filter → chart visual feedback) has no
explicit visual indicator. When the user filters by Status = "FAILED" or by
a date range, the bar chart still shows all categories at full opacity with no
visual cue that the data is narrowed. The Setproduct guide says: "A filtered
table that looks identical to an unfiltered one is how people misread data and
make bad calls."

The question is: what visual treatment communicates "the chart is showing
filtered data" without requiring the user to re-read the filter pills?

## Options

### Option 1: Visual dimming + badge on filtered charts

When `filters.category` is empty but other filters are active (status, date,
amount, merchant search), dim all chart bars to 60% opacity and add a small
badge "Showing filtered results — Clear to reset" above the chart. The active
category is highlighted only when `filters.category` has a specific value.

- *How it feels:* The chart immediately signals "this is a subset." Users
  understand the view is narrowed.
- *Cost:* ~1 hour — conditional opacity + a badge element.

### Option 2: Summary text above each chart

Add a line above each chart: "Showing 2,347 / 9,960 transactions (filtered by
Status: FAILED, Date: Aug 2024–Aug 2026)." This is explicit but takes vertical
space.

- *How it feels:* Very explicit — the user always knows exactly what subset
  they're viewing. But it's verbose and competes with the chart for attention.
- *Cost:* ~30 minutes — compute summary text from filters.
- *Source:* Setproduct: "Filter chips answer 'what am I looking at right now'
  without making people reopen a filter panel to check."

### Option 3: Chart-level filter chips

When any non-category filter is active, show small removable chips above the
chart: "Status: FAILED ✕", "Date: Aug 2024 ✕". Clicking the ✕ clears that
filter.

- *How it feels:* Consistent with the filter pills in the FilterBar. Users
  can see and clear filters directly from the chart.
- *Cost:* ~45 minutes — reuse the existing activeFilters logic from FilterBar.
- *Risk:* May feel redundant with the filter pills already shown above the table.

## Reasoning

**Option 1 (visual dimming + badge) is the best choice** for the bonus item.

The key insight is that the chart and table already share data — both read from
`getFiltered()`. No data sync is needed. The gap is purely visual: there's no
signal that the chart's aggregation is computed over a filtered subset.

### Why visual dimming + badge

1. **Immediate recognition** — a 60% opacity on all bars is an instant visual
   cue that "something is active." The human visual system picks up the
   dimming before reading text.

2. **Minimal space cost** — a badge is ~24px tall, same as the existing chart
   header. No extra vertical space in the layout.

3. **No redundancy** — the filter pills are already shown above the table in
   the FilterBar. Adding duplicate chips on the chart would be noise. A single
   badge is a summary signal, not a repetition.

4. **Consistent with raw-aesthetics** — the `fintech-ui-2026` skill says
   "every visual element should serve a functional purpose." Dimmed bars
   serve the function of signaling filtered state. The badge serves the
   function of explaining the dimming.

### Why not summary text (Option 2)

Verbose. The chart header already has a title ("Spend by Category"). Adding
a 50-character summary line makes the chart feel crowded. The badge is
24px and communicates the same information more efficiently.

### Why not chart-level chips (Option 3)

Redundant with the FilterBar's filter pills. The current design already shows
active filters as pills above the table. Doubling them on the chart violates
"no decoration for decoration's sake."

## Implementation approach

1. **Detect filtered state** — in `AnalyticsView.tsx`, check whether
   `filters.category` is empty AND any other filter is active. Use the same
   `activeFilters` derivation logic already in `FilterBar.tsx`.

2. **Dim bars when filtered** — in the `barChartData` datasets, set
   `backgroundColor` to `barColors.map(() => "rgba(212, 175, 55, 0.3)")` when
   filtered and no category is selected. When a category IS selected, keep
   the highlight on that bar.

3. **Add badge** — a small inline element in the chart header div:
   `<span className="text-xs font-mono text-accent">filtered · {filteredTxns.length} of {totalTxns} {totalTxns}</span>`

4. **Table-to-chart direction** — when the user sorts the table by a column
   (e.g., "Amount"), the chart doesn't need to change. But when the user
   applies a filter that excludes some categories entirely, those bars should
   disappear from the chart (they get 0 total). This already works because
   `categoryData` is derived from `getFiltered()`.

## Tradeoffs

- **Badge text length** — "filtered · 2,347 of 9,960" could wrap on a
  360px screen. Solution: use `whitespace-nowrap` and `overflow-hidden text-ellipsis`.
- **Dimming vs hiding bars** — if a category is fully excluded by a filter,
  its bar disappears entirely (aggregation = 0). This is correct behavior —
  only show categories that have data in the current view.
- **The chart already updates** — when `filters.category` changes, the bar
  chart re-renders with the new subset. The missing piece is just the
  "filtered" visual indicator for non-category filters.

## Notes

- The Analytics bar chart click handler already calls
  `setFilters({ category: [clickedCategory] })` — the reverse direction
  (table → chart) is automatic because both read from the same store.
- Referenced in: `docs/table-performance-enhancement/intro.md`
- Referenced in: `docs/plutus-client/chart-to-table-filtering/intro.md` (if it exists)
