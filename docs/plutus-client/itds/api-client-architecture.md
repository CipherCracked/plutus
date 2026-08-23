| ITD 1 - "Use native fetch with SWR for API data fetching in the Plutus Next.js frontend." |

| :---- | :---- |

| **THE PROBLEM** | The Plutus frontend needs to fetch data from the FastAPI backend (4 endpoints: GET /transactions, GET /balance, GET /rewards, POST /redeem) and cache it client-side to avoid refetching 10k transactions on every page navigation. The data-fetching strategy must support caching, revalidation, error handling, and optimistic updates for the redemption flow — all within the Next.js 13 App Router + TypeScript constraint with no component library dependencies. | **OPTIONS CONSIDERED (Decision in bold)** |

| **Option 1** | **Native fetch + SWR (stale-while-revalidate)** — use `fetch()` directly in React hooks wrapped with SWR for caching, revalidation, and error handling. SWR is lightweight (~2KB), zero-dependency, and integrates naturally with React's component model. |

| **Option 2** | React Query — more full-featured with query keys, pagination helpers, and devtools. But heavier (~10KB) and adds API surface that's unnecessary for a 24-hour assignment with 4 simple endpoints. |

| **Option 3** | Native fetch + custom hooks — write hand-rolled `useTransactions`, `useBalance`, `useRewards` hooks with `useEffect` + `useState`. No caching abstraction, each hook manages its own loading/error state. Simple but repetitive and no automatic revalidation. |

| **Option 4** | Next.js Server Actions + App Router data fetching — use `fetch` directly in server components for initial data, client components for mutations. But Server Actions add complexity for a demo where the backend is already a separate FastAPI service. | **REASONING** |

| **Caching strategy** | The 10k-row transaction dataset is static (seeded once, doesn't change during the demo). This means aggressive caching with long TTLs is safe — SWR's default 10s revalidation is overkill. For the transactions endpoint, use `dedupingInterval: 300000` (5 min) since the data never changes. For balance and rewards, use the default SWR revalidation since redemptions change the coin balance. |

| **Why SWR over React Query** | React Query excels when you need complex pagination, background refetching, or mutations with optimistic updates across many endpoints. Plutus has 4 simple endpoints and a static dataset — SWR's simpler key-based API (`useSWR('/api/transactions', fetcher)`) is sufficient and lighter. The redemption flow (POST /redeem) needs an optimistic update on balance, which SWR handles via `mutate()` — simpler than React Query's `queryClient.setQueryData`. |

| **Why not pure fetch** | Without SWR (or similar), each component would need its own `useEffect` + `useState` for loading/error/state. This duplicates logic across the table, charts, and rewards views. SWR eliminates this boilerplate and provides automatic caching, deduplication of concurrent requests, and revalidation on focus/reconnect. | **TRADEOFFS** |

| | | **TRADEOFFS** |

| | | - SWR adds ~2KB to the bundle. The benefit (caching, revalidation, error handling) justifies this for a 4-endpoint demo. |

| | | - The `mutate('/api/balance')` call after a successful redemption is a manual step — easy to forget. This is documented as a known limitation. |

| | | - Server-side rendering: SWR in client components means initial data is fetched on the client (loading state visible). For a 10k-row dataset, this could show a brief "loading" state. SWR's `initialData` prop can mitigate this if needed. | **NOTES** |

| | | - API client: a single `src/lib/api.ts` module wraps all `fetch` calls with a shared base URL, error handling, and TypeScript types matching the FastAPI Pydantic models. |

| | | - Fetcher function: `(url) => fetch(url).then(r => r.json())` passed to all `useSWR` calls. |

| | | - The transactions endpoint returns the full 10k-row set once; filtering/search/sort happens client-side via the Zustand store (per [[client-state-management]] decision). |

| | | - POST /redeem calls `fetch` directly (not SWR), then calls `mutate('/api/balance')` and `mutate('/api/rewards')` to update the cache. |

| | | - Error handling: 400/402/404 responses from the backend are caught and surfaced via SWR's `error` object in each component's `useSWR` result. |
