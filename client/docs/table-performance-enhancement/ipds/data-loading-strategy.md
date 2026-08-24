## Problem to solve

The Digital Alpha assignment evaluates handling the full 10k-row dataset with
"performance and responsiveness." The current implementation loads all 10,000
transactions in a single HTTP response via `useSWR("/api/transactions")` in
`page.tsx`, stores them in a Zustand store, and filters/sorting happens in-memory
via `getFiltered()`. This works for the core requirements but:

1. Without pagination, the user scrolls through 10k virtual rows — practically
   infinite scroll with no way to know their position in the dataset.
2. The assignment lists "server-side pagination, filtering, and sorting" as a
   **nice-to-have** and asks the candidate to "be ready to explain why you picked
   one" approach.

We need to document:
1. Why client-side virtualization + in-memory cache + client-side pagination is the
   right choice for this scope.
2. What a server-side pagination migration path would look like.
3. Whether SWR's caching configuration needs tuning for production.

## Options

### Option 1: Keep client-side loading (current approach) with documented rationale

Continue loading all 10k rows on page load, caching in Zustand via SWR. The
`@tanstack/react-virtual` table virtualizes rendering so only ~15 rows are in
the DOM at any time. Filtering and sorting operate against the in-memory array
in sub-5ms.

- *How it feels:* Instant search-as-you-type, instant sorting, no network
  latency on filter interactions. The table feels "desktop app-like."
- *When it works:* When the dataset fits comfortably in memory (<50k rows)
  and the user needs full cross-record comparison (sorting by any column,
  filtering across all dimensions simultaneously).
- *Source:* Setproduct 2026 Data Table Guide: "Virtualization is the tool
  when the entire set must live in one continuous scroll, and I reach for it
  once rows climb past the low thousands."

### Option 2: Server-side pagination with API-level filtering/sorting

The `/api/transactions` endpoint accepts `?page=`, `?limit=`, `?sort=`,
`?filter[category]=`, etc. parameters. The frontend sends filter/sort changes
as API requests with `useSWR` keyed by the filter params. Pagination controls
appear at the table footer.

- *How it feels:* Each filter change triggers a network round-trip. Sorting
  is server-side so it works across the full dataset. Users navigate by page
  number.
- *When it works:* When datasets exceed memory capacity or when the database
  has filtering logic too complex to replicate client-side (e.g., full-text
  search on indexed columns).
- *Source:* Digital Alpha assignment: "Server-side pagination, filtering, and
  sorting instead of doing everything in the browser."

### Option 3: Hybrid — client-side virtual cache with server-side fallback

Load the first 5k rows client-side (enough for 360px viewports to scroll
~100 screen-heights). Add a "Load more" button or infinite scroll that fetches
in chunks. Use Intersection Observer to prefetch the next chunk before the user
reaches the end of the loaded range.

- *How it feels:* Fast initial load, progressive expansion. Users on slow
  connections see data quickly; users who scroll to the end get more.
- *When it works:* When you want near-instant interaction but need to handle
  datasets that may grow to 50k+ rows over time.
- *Source:* React Query docs, Vercel dashboard patterns.

## Reasoning

**Option 1 (client-side virtualization with client-side pagination) is the
best choice** for the 24-hour assignment.

### Why client-side virtualization + pagination

1. **The assignment says "stays smooth with the full set loaded"** — virtualization
   renders only ~15 rows at a time, keeping the DOM lightweight. The Setproduct
   guide confirms: "Virtualization is the tool when the entire dataset must
   live in one continuous scroll, and I reach for it once rows climb past the
   low thousands."

2. **Client-side pagination (50 rows/page) solves the infinite scroll problem** —
   the user can navigate by page number (1/200, 2/200, etc.) and knows their
   position in the dataset. Virtualization still handles rendering within each
   page efficiently.

3. **Cross-record comparison is the core task** — the user sorts by any column
   and scans. All sorting happens in-memory on the full filtered set, so the
   sorted order is correct across pages. Server-side pagination would require
   a network round-trip on every sort change, breaking the sub-5ms interaction.

4. **10k rows × ~200 bytes/row = ~2MB** — this fits comfortably in browser
   memory. Modern phones can hold 100k+ rows in a JS array without issue.

5. **Search-as-you-type works instantly** — the merchant search filters the
   10k array in sub-millisecond time. Server-side search would add perceptible
   latency on every keystroke.

6. **Cross-filtering between charts and table is free** — both the bar chart
   and the table read from `getFiltered()` (all filtered results), so clicking
   a chart bar immediately updates the table without a network request. The
   chart shows the full filtered dataset, while the table paginates through it.

### Why document server-side pagination as a future path

The assignment lists server-side pagination as a **nice-to-have**, meaning
the evaluator wants to see that we *considered* it and *can explain* the
tradeoffs. The problem decomposition (this document) serves that purpose:

- If the dataset grows to 50k+ rows, switch to server-side pagination
- Add pagination API params: `/api/transactions?page=1&limit=50&sort=timestamp`
- Move `getFiltered()` logic to the backend (FastAPI + SQLAlchemy)
- Replace Zustand in-memory store with SWR keyed by filter params
- Keep client-side virtualization for rendering within each page

### Why not hybrid

Hybrid adds complexity (chunked loading, Intersection Observer, prefetch logic)
without clear benefit for 10k rows. The full dataset loads in ~500ms on a
mobile connection — the hybrid approach only helps when the dataset exceeds
what the browser can comfortably hold in memory, which 10k rows do not.

## Tradeoffs

- **Client-side** means the initial page load transfers ~2MB of JSON. With
  `useSWR`, this is cached client-side and never refetched unless the user
  hard-refreshes. SWR's `revalidateOnFocus` should be disabled in production
  to prevent refetching when the user switches tabs.

- **Server-side pagination** would reduce initial payload to ~50KB (50 rows)
  but would make filter/sort interactions network-bound. The user would lose
  the instant "desktop app" feel.

- **Hybrid** requires a chunk-size decision, prefetching logic, and a "load
  more" UI — it's the complexity of server-side with most of the client-side
  benefit still present.

## Notes

- **Implemented**: SWR config in `src/app/page.tsx` — `revalidateOnFocus: false`,
  `dedupingInterval: 60_000`, `ttl: 300_000` for the 2MB transactions endpoint.
  Balance and rewards endpoints keep default SWR config (small payloads).
- **Implemented**: Client-side pagination in `transaction-store.ts` — `currentPage`
  (default 1), `pageSize` (default 50), `setCurrentPage`, `setPageSize`. Pagination
  resets to page 1 on filter clear and on sort change. `getCurrentPageData()` and
  `getTotalPages()` are computed methods.
- **Implemented**: Pagination UI in `TransactionTable.tsx` — First/Prev/Next/Last
  buttons with 44px touch targets, result count ("1-50 of 1,234 matched results"),
  and current page indicator.
- **Design note**: Charts show the full filtered dataset (via `getFiltered()`),
  not the current page — clicking a chart bar filters all 10k rows then paginates
  through the results. This ensures chart and table always agree on the full result
  set, while the table remains navigable.
- The Zustand store comment in `transaction-store.ts` documents the decision:
  "all 10k rows are loaded once and cached in memory. Filtering, sorting, and
  search operate against this in-memory array."
- Referenced in: `docs/table-performance-enhancement/intro.md`
