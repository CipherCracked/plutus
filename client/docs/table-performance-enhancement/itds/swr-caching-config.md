## Problem to solve

The Digital Alpha assignment lists "server-side pagination, filtering, and
sorting" as a nice-to-have, and asks candidates to "be ready to explain why
you picked one." The current implementation uses `useSWR("/api/transactions", ...)`
in `page.tsx` with default SWR configuration. This fetches the full 10k-row
dataset on page load and caches it in SWR's in-memory cache. The data is then
transferred to the Zustand store via `useEffect`.

With default SWR config, `revalidateOnFocus` is `true` — meaning when the user
switches tabs and comes back, the 10k-row dataset is refetched. On a 3G
connection this is a 2MB retransfer that the user doesn't expect.

The question is: what SWR configuration should be used for a large dataset
that is cached client-side anyway?

## Options

### Option 1: Disable revalidateOnFocus + extend deduping

```ts
const { data: txnData } = useSWR("/api/transactions", () => fetchTransactions(), {
  revalidateOnFocus: false,
  dedupingInterval: 60_000, // 60s — dedupe rapid refetches
})
```

- *How it works:* SWR fetches once on mount. If the user switches tabs and
  back within 60s, no refetch occurs (deduping). If they return after 60s,
  SWR revalidates silently (background, no loading state). No more
  unexpected 2MB re-transfers on tab-switch.
- *When it works:* For datasets that are cached client-side in Zustand and
  don't need real-time freshness. Financial transaction data is eventually
  consistent — the user doesn't need sub-second refresh.
- *Source:* SWR docs — `dedupingInterval` defaults to 2s, `revalidateOnFocus`
  defaults to true. For large datasets, disabling focus revalidation is
  standard practice.

### Option 2: Keep default SWR config

No changes. The page refetches 2MB on every tab-switch. This is the current
behavior.

- *When it matters:* If the backend data changes frequently (e.g., real-time
  payment processing). For a 24-hour assignment demo, this is unlikely.

### Option 3: Add SWR middleware for cache-to-Zustand hydration

Instead of `useEffect` syncing, use SWR's `subscribe` callback or a custom
mutation to keep Zustand and SWR in sync.

- *When it works:* When you need bidirectional sync between SWR cache and
  Zustand store (e.g., mutations in Zustand should invalidate SWR).
- *Cost:* Significant — adds a sync layer that the current architecture
  doesn't need (data flows one direction: API → SWR → Zustand → UI).

## Reasoning

**Option 1 (disable revalidateOnFocus + extend deduping) is the best choice.**

The 10k-row dataset is ~2MB of JSON. Transmitting it on every tab-switch
(via `revalidateOnFocus: true`) is wasteful when:
- The Zustand store holds the data in-memory for the session.
- Filters operate against the in-memory array, not the API.
- The user doesn't need sub-second data freshness — transactions settle in
  minutes/hours, not seconds.

The Setproduct guide says: "Virtualization is the tool when the entire set
must live in one continuous scroll." The same philosophy applies to data
loading — if we're holding 10k rows in memory for virtual render, we should
also avoid refetching that data unnecessarily.

### SWR config details

```ts
useSWR("/api/transactions", () => fetchTransactions(), {
  // Don't refetch on tab-switch — 2MB dataset is cached in Zustand
  revalidateOnFocus: false,
  // Dedupe rapid refetches within 60s (prevents double-fetch on slow mounts)
  dedupingInterval: 60_000,
  // Keep data for 5 minutes even after component unmounts
  // (allows back navigation without refetch)
  ttl: 300_000,
})
```

For `/api/balance` and `/api/rewards` (small payloads), keep default config —
these are <1KB and benefit from focus revalidation.

### Why not keep defaults

With `revalidateOnFocus: true` (default), if the user:
1. Opens the app (2MB fetch)
2. Switches to check email (tab blur)
3. Switches back (2MB refetch)

They pay 2MB × number of tab-switches for data that hasn't changed. On a
metered mobile connection, this is a real cost.

### Why not server-side pagination

The assignment's nice-to-have lists "server-side pagination" as an option. We
chose client-side pagination instead:

1. **Instant filtering** — the full 10k rows are in memory, so search-as-you-type
   filters against all records in <5ms. Server-side pagination would require a
   network round-trip for every keystroke.

2. **Single fetch** — 2MB downloaded once, cached in Zustand+SWR. Server-side
   pagination would re-fetch on every page/sort/filter change.

3. **Chart sync** — AnalyticsView reads all filtered results for aggregation.
   Server-side pagination would require a separate "aggregate over all matching
   rows" endpoint.

Server-side pagination would only be needed if the dataset grows beyond 10k rows
or if real-time data freshness becomes a requirement. The current client-side
pagination (50 rows/page) handles 10k rows with no UX issues.

## Tradeoffs

- **Stale data** — with `revalidateOnFocus: false`, the user sees data from
  when they loaded the page, not the freshest. For a demo assignment this is
  fine; for production, a "Last updated: ..." timestamp or refresh button
  would mitigate.
- **Zustand vs SWR** — the current architecture has two caches: SWR (for
  fetching) and Zustand (for filtering). This is intentional but slightly
  unusual. A purist would use SWR's `mutate` to write back to the cache.
  For this assignment, the dual-cache is simpler to explain.
- **Memory on mobile** — 10k rows in a JS array is ~2MB. Modern phones
  handle this fine, but if the dataset grows to 100k+, switch to
  server-side pagination.

## Notes

- The SWR call is in `src/app/page.tsx` line 21.
- The Zustand store sync happens in `src/app/page.tsx` lines 25-35.
- Referenced in: `docs/table-performance-enhancement/intro.md`
- Referenced in: `docs/table-performance-enhancement/ipds/data-loading-strategy.md`
