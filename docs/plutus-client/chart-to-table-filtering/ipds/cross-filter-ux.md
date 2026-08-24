## Problem to solve

When a user clicks a bar (or slice) in the analytics charts, the transaction table should immediately filter to show only the relevant transactions. The chart and table must feel like two views of the same data — not disconnected panels. The question is: what interaction model best serves a financial dashboard where the user is exploring spending patterns?

## Options

### Option 1: Click-to-filter with single-selection

Clicking a category bar sets the table's category filter to that one category. The table instantly jumps to showing only those transactions. A small "x" badge appears on the chart header letting the user clear the filter. Clicking a different bar replaces the selection.

- *How it feels:* Surgical and immediate. The user is always in control — the table responds instantly, the chart bar gets a highlight, and there's always a clear path back. This matches how analysts think: "I want to see everything in 'Dining'" → click Dining → table narrows.
- *When it makes sense:* When the primary mental model is "drill down into a subset." This is the most common pattern in BI tools (Tableau, Looker) and feels familiar yet powerful.

### Option 2: Toggle multi-category selection

Clicking bars adds/removes categories from a set. Multiple bars can be highlighted simultaneously, and the table filters to the union. Useful for "show me Dining + Entertainment."

- *How it feels:* Like a tag filter on an e-commerce site. More expressive, but adds cognitive load: the user must track which bars are selected and what the union represents. The chart gets visually cluttered with multiple highlights.
- *When it makes sense:* When the user frequently needs to compare non-adjacent categories. For a 24-hour assignment with 10k rows, this is over-engineering.

### Option 3: Drill-through to detail view

Clicking a bar navigates away from the analytics page entirely to a filtered transaction list. The chart disappears and the table takes over.

- *How it feels:* Like a report generator. The user loses context — they can no longer see the chart they were just looking at, so they can't easily pivot ("oh, what about Groceries instead?"). This is a "commit" action, not an exploratory one.
- *When it makes sense:* When the chart is a starting point for a separate workflow, not an interactive dashboard.

### Option 4: No cross-filtering (charts for visualization only)

The charts show aggregate data but clicking does nothing. Filters are only available via the FilterBar on the table page.

- *How it feels:* Disconnect. The user sees an interesting bar in the chart but can't click it — they have to hunt for the same category in the filter dropdown. This breaks the "two views of the same data" illusion.
- *When it makes sense:* Never, for this assignment. The brief explicitly requires: "At a minimum, clicking a slice of a chart should filter the transaction table."

## Reasoning

**Option 1 (click-to-filter with single-selection) is the correct choice.**

The assignment brief is explicit: "At a minimum, clicking a slice of a chart should filter the transaction table." This is a minimum bar — Option 4 is out. But Options 2, 3, and 4 each add complexity or break the user's flow:

- Option 3 (drill-through) is the wrong interaction model. This is a dashboard where exploration happens in one view — the charts on top, the table below. Navigating away loses the charts and makes pivoting tedious.
- Option 2 (multi-select) is interesting but over-engineered for a 24-hour assignment. The transaction table already has multi-category filters via its FilterBar — the chart click should be a quick entry point for the most common filter action, not a parallel multi-select UI.
- Option 1 matches how the table's existing filter system works: single-select per dimension, with an easy "clear" path.

The single-selection model aligns with the existing `setFilters({ category: [...] })` API on the transaction store — one bar click sets a one-element array, which replaces any prior category filter. This is consistent with how the FilterBar's dropdown works.

## Tradeoffs

- **Single-selection limitation:** The user can't build "Dining + Entertainment" by clicking bars. But they can use the FilterBar's category dropdown for multi-select — the chart is a quick entry, not the only filter path.
- **Bar highlight state:** A clicked bar needs a persistent visual indicator (e.g., accent border or fill) so the user knows which category is active. This requires a small CSS class on the Chart.js bar element.
- **Chart re-aggregation:** When the table filters change (via FilterBar), the charts must recompute totals for the filtered set. This means the charts lose the "all transactions" view when filters are active — a subtle tradeoff. The summary is: chart bars shrink to reflect only the filtered data, which can be confusing ("where did the Groceries bar go?"). Acceptable for the assignment scope.

## Notes

- **Visual feedback:** The active category bar gets `backgroundColor: '#d4af37'` (gold accent) while inactive bars stay at their original color. A "Clear filter" button appears in the chart header when a bar is active.
- **Empty state:** If the filtered set has no transactions in a category, that bar disappears from the chart entirely. If the filtered set is empty overall, the chart shows "No data in current view."
- **Monthly trend:** Clicking a monthly bar could filter by month, but this is secondary — the primary cross-filter target is the category breakdown, which is the chart the brief references ("clicking a slice of a chart").
- **Performance:** Chart re-render on every filter change is free — the in-memory aggregation takes <2ms for 10k rows. No debouncing needed.
- **Sync direction:** The primary flow is chart → table. But when the table's FilterBar changes the category filter, the chart must also update its highlight to match — this is automatic since both read from the same Zustand store.
