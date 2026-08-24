# Assumptions

Product decisions made where the Digital Alpha assignment brief was vague or
unspecified. These are documented here for transparency and traceability.

---

## 1. Single-user demo — no authentication

**The brief** does not specify a user model or authentication. It says
"single-user demo" in the non-goals but doesn't name the user.

**Assumption:** There is one default user. The frontend never sends credentials.
The backend exposes a static `username` in the balance response. No login flow,
no session management, no user switching.

**Implication:** The `CoinBalance` response includes `username: "demo_user"`
or similar. No auth headers on API requests.

## 2. Transactions are static — no real-time updates

**The brief** mentions a seeded dataset but doesn't specify whether transactions
arrive in real time (e.g., a new bill payment happening during the demo).

**Assumption:** Transactions are seeded once and are static for the duration of
the demo session. The frontend loads them once and caches in Zustand.

**Implication:** SWR is configured with a 5-minute deduping interval for
transactions. No WebSocket or polling. No optimistic UI for new transactions.

## 3. Coin formula applies only to SUCCESS transactions

**The brief** gives the formula as `min(floor(amount / 100), 50)` but doesn't
specify how it interacts with the `status` field (SUCCESS / FAILED / PENDING).

**Assumption:** Coins are earned only for SUCCESS transactions. PENDING and
FAILED transactions earn 0 coins (even if the amount is high).

**Implication:** `coins_earned` column in the seed script is computed as
`min(floor(amount / 100), 50)` if `status = 'SUCCESS'`, else 0. The frontend
displays `coins_earned` as-is (already pre-computed in the database).

## 4. Negative transaction amounts earn 0 coins

**The brief** says the formula is `min(floor(amount / 100), 50)` but doesn't
address negative amounts (which could represent refunds or credits).

**Assumption:** `floor(negative / 100)` would be ≤ 0, but `min(0, 50) = 0`, so
negative amounts naturally earn 0 coins. This is consistent with the formula
without additional special-casing.

**Implication:** No explicit `if amount < 0` check in the seed script — the
formula handles it.

## 5. Reward redemption is atomic — no race conditions

**The brief** requires a redeem endpoint but doesn't describe concurrency
behavior (e.g., two simultaneous redemption attempts that would overdraw the
balance).

**Assumption:** The backend performs an atomic check-then-deduct in a single
database transaction. If the balance is insufficient, the API returns a 402
status. The frontend treats any non-2xx response as a redemption failure.

**Implication:** `POST /api/redeem` returns 402 if `new_balance < 0`. The
frontend's `redeemReward()` function throws an error, which the RewardsView
component catches and surfaces as a user-facing error message.

## 6. Chart data comes from in-memory aggregation, not a separate API endpoint

**The brief** describes a `/api/analytics` endpoint but the chart-to-table
cross-filtering requirement means charts must reflect whatever filters the
user has applied to the table.

**Assumption:** The `/api/analytics` endpoint exists (for the README's API
documentation) but the frontend computes charts from the in-memory
`transactions` array via `getFiltered()`. This keeps charts and table in sync
with zero API round-trips.

**Implication:** The backend `/api/analytics` endpoint is available but unused
by the primary chart rendering path. It remains as a fallback.

## 7. Dark mode is first-class, light mode is secondary

**The brief** doesn't specify a color scheme preference. The 2026 UI trends
(firecrawl research) favor dark mode as the primary aesthetic.

**Assumption:** Design starts in dark mode. Light mode is derived from the
same token system but receives less visual polish (it's functional, not
fine-tuned).

**Implication:** The theme uses CSS custom properties with `prefers-color-scheme`
fallbacks. Dark mode gets the full "raw aesthetics + anti-liquid glass" treatment.

## 8. Responsiveness down to 360px means functional, not pixel-perfect

**The brief** says "responsive down to 360px" but doesn't specify which
breakpoints or how the layout should adapt.

**Assumption:** Layout collapses to a single column on narrow screens. The
table becomes horizontally scrollable. Charts stack vertically. The rewards
grid goes from 3 columns → 1 column.

**Implication:** No complex mobile-specific redesign — just a functional
responsive layout that doesn't break at 360px.

## 9. The seed script runs in one command and is safe to re-run

**The brief** mentions seeding but doesn't specify idempotency.

**Assumption:** `python seed.py` is idempotent — it drops existing data and
re-seeds from scratch. Re-running it won't duplicate rows or error out.

**Implication:** The seed script uses `DROP TABLE IF EXISTS ... CASCADE` followed
by `CREATE TABLE` and `INSERT`. Running it twice yields the same dataset.

## 10. 10k rows is the exact count

**The brief** says "approximately 10,000 transactions."

**Assumption:** The seed script generates exactly 9,960 transactions (as
discovered during backend testing). This is "approximately 10,000" in the
assignment's terms.

**Implication:** The README says "~10k transactions" and the seed script
constant is `NUM_TRANSACTIONS = 9960`.
