## Problem to solve

The transactions dashboard must display ~10,000 rows smoothly while supporting multi-column filtering, live merchant search, sorting by date and amount, and row-click to open detail. The core UX decisions — how rows are rendered (virtualization vs pagination) and how filters are presented — will fundamentally shape the frontend architecture and whether the table feels responsive or sluggish. This is the highest-weighted evaluation criterion (frontend engineering + CSS/UI craft + 10k-row handling).

## Options

### Option 1: Client-side virtualization (e.g. react-virtual + CSS grid table)
Load all 10k rows into memory once (via an API that returns the full set or a large window), then render only visible rows using windowing. The table behaves like a spreadsheet: scroll infinitely, no page boundaries. Filtering, sorting, and search operate against the in-memory dataset.

- *How it feels:* Seamless scrolling, instant search-as-you-type, no pagination controls cluttering the UI. But the initial data fetch could be heavy, and the browser holds 10k objects in memory.
- *When it makes sense:* Dataset fits comfortably in memory (<50MB), and the user is expected to jump around the full set frequently rather than browse page-by-page.

### Option 2: Server-side pagination with API-driven filtering
The API returns one page of rows (e.g. 20–50) at a time. Every filter change, sort, search, and page navigation triggers a round-trip to the backend, which applies the query against PostgreSQL and returns the matching page.

- *How it feels:* Familiar page-navigation UI, minimal front-end memory footprint. But every filter keystroke triggers a network request, adding latency to search and filter interactions.
- *When it makes sense:* Dataset is too large for memory, or filtering/sorting is expensive enough that you need database-level execution.

### Option 3: Hybrid — server pagination with client-side cache
The backend paginates server-side, but the frontend caches recently fetched pages and results sets. Virtualization is applied to the rendered page list (so only ~20 rows are in the DOM), but the data itself comes from the server per page.

- *How it feels:* Combines the performance benefits of virtualization (DOM stays light) with the memory efficiency of pagination. More complex to implement correctly.
- *When it makes sense:* You want the best of both worlds but have time to implement the caching layer.

### Option 4: Live search with debounced server-side filtering + virtualized results
A compromise: render only visible rows (virtualization), but fetch filtered/sorted results from the server with a debounce on search input. The full dataset is never loaded into the browser; only the current filtered + sorted view is fetched and paginated server-side, then virtualized on the client.

- *How it feels:* Fast scrolling through results, search is slightly delayed (debounced) but doesn't block the UI. Best perceived performance for large filtered sets.
- *When it makes sense:* You need both smooth scrolling and server-side filtering — a common pattern for admin dashboards.

## Reasoning

The 10k-row dataset is small enough to fit in browser memory (~2–5MB of JSON depending on fields), and virtualization libraries like `react-virtual` or native `content-visibility` can render only visible rows without a heavy dependency. The assignment says "pagination or virtualization is up to you, just be ready to explain why you picked one" — so either is explicitly acceptable.

The strongest case is for **Option 1 (client-side virtualization)** or **Option 4 (server-filter + virtualize)** as foundation choices:

- Virtualization keeps the UI feeling instantaneous — no pagination controls, no network latency on every filter change.
- For 10k rows, loading the full set once (or in one API call) is feasible and eliminates per-interaction round-trips.
- The hand-built table constraint means we control the rendering — we can wire virtualization directly without a component library.
- Live merchant search-as-you-type works best against in-memory data (Option 1); against server data (Option 4) it needs debouncing, which feels less responsive.

The main risk with Option 1 is the initial data transfer size. If the backend API returns all fields for all 10k rows at once, the payload could be large. This suggests the API should support a "fetch all for client-side processing" mode OR we accept that the initial load is the one heavy operation and everything thereafter is fast.

Option 2 (pure server-side pagination) is the more "traditional" approach and is explicitly mentioned as "the stronger approach" in the assignment. However, it introduces perceptible latency on search/filter interactions and requires more API calls.

## Tradeoffs

- **Option 1**: Fast UX, simple frontend state, but large initial payload and no natural "pages" for the user to reference/share. If the dataset grows to 100k rows, memory becomes a real concern.
- **Option 2**: Scales well, shareable page URLs, minimal memory. But poor perceived performance on search/filter, and more complex backend query logic.
- **Option 4**: Best balance of performance and scalability, but most complex to implement — two data-fetching strategies (one-off full load vs. paged filtered queries).

## Notes

This decision is tightly coupled to the **ITD: PostgreSQL schema & data layer** — if we go with client-side virtualization and load everything at once, the API needs a single endpoint that returns all transactions. If we go server-side, the API needs rich query parameters ($filter, $sort, $search, page, limit).
