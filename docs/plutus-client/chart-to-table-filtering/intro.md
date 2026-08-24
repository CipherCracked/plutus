# Chart-to-Table Cross-Filtering

## Problem Statement

The AnalyticsView currently renders pre-aggregated charts fetched from the backend
`/api/analytics` endpoint. The transaction table uses a separate Zustand store for
filtering. These two systems are disconnected — clicking a bar in the "Spend by
Category" chart does nothing to the transaction table.

The assignment requires: "At a minimum, clicking a slice of a chart should filter
the transaction table." We need bidirectional cross-filtering: chart interactions
propagate to the table, and the table's active filters are reflected in the chart
data.

## Background and Context

- **AnalyticsView** fetches `category_breakdown` and `monthly_trend` from the API.
- These are pre-aggregated SQL queries — they represent ALL transactions, not the
  currently filtered subset visible in the table.
- **TransactionTable** holds the full dataset in Zustand, with `getFiltered()`
  applying the active filters.
- To enable cross-filtering, the charts must be computed from the **same
  in-memory transaction array** that the table filters, so they stay in sync.

## Goals

- Clicking a bar in the category breakdown chart sets the `category` filter on
  the transaction store, updating the table.
- The charts reflect the table's active filters (filtered transactions are also
  reflected in the chart totals).
- Clear filter interactions are discoverable (visual indication of active filter,
  ability to clear).

## Non-Goals

- Server-side filtered analytics — everything stays client-side.
- Multi-dimensional filtering (e.g., clicking a bar while other filters are
  active does not compound in unexpected ways — it replaces the category filter).
- Persisting filter state to URL or localStorage.

## Constraints

- Must use the existing Zustand transaction store (already has `setFilters`).
- Charts must render from the in-memory `transactions` array, not the API.
- Chart.js click handlers must map to store actions.
- The backend `/api/analytics` endpoint can still be used as a fallback or for
  the summary cards, but primary chart data comes from client-side aggregation.

## Assumptions

- The full 10k transactions are already loaded in the store when AnalyticsView
  mounts (they're fetched in the page via SWR + populated into the store).
- Category breakdown is the primary cross-filter target (monthly trend bars are
  informational, not filterable — a click there would be ambiguous).
- A single category can be selected at a time; clicking another replaces it.

## Problem Tree

```text
How to implement chart-to-table cross-filtering?
├── How to source chart data — re-aggregate in memory or keep using the API?
├── How to wire chart click handlers to the transaction store?
├── How to handle filter clearing from the chart UI?
└── How to keep summary cards in sync with the filtered view?
```

## Open Questions

- Should the monthly trend chart also support click-to-filter by month?
- Should the API still be fetched at all, or fully client-side?
- How to visually indicate that a bar is the active filter?
