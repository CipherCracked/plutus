## Problem to solve

When a user tries to redeem a reward they can't afford, or a reward
that doesn't exist, what should the backend API return so the frontend
can show a clear, actionable error message? The assignment requires
"proper validation and error handling" but doesn't specify the error
contract.

## Options

### Option 1: Distinct HTTP status codes per error type

- **400 Bad Request** — invalid reward ID (not a number, negative)
- **402 Payment Required** — insufficient coin balance
- **404 Not Found** — reward ID doesn't exist in the catalogue
- **200 OK** — success with `RedeemResponse` (success, message, new_balance)

- *How it feels:* The frontend knows exactly what went wrong without
  parsing a JSON error body. `402` is the canonical HTTP status for "you
  don't have enough money" — it's semantically precise. The frontend
  can branch on `error.status === 402` and show "You need 100 more coins"
  vs. `error.status === 404` and show "This reward is no longer available."

- *When it makes sense:* When the frontend needs to distinguish error
  types for different UI treatments. This is the case — insufficient
  balance (redemption blocked, show balance link) vs. invalid reward
  (error toast, suggest browsing other rewards).

### Option 2: 200 OK with a `success: false` field

- **200** — always return 200, with `RedeemResponse(success=false, message="Insufficient balance")`
- *How it feels:* Simplest HTTP pattern but the client can't distinguish
  errors without reading the JSON body. Retry logic, cache behavior, and
  error logging all assume 4xx/5xx for failures. Tools like SWR's
  `onError` callback won't fire on a 200.

- *When it makes sense:* Never for this assignment. The frontend's
  `redeemReward()` function throws on any non-2xx response — a 200 with
  `success: false` would not trigger the error path, and the redemption
  would appear to "succeed" with a confusing message.

### Option 3: 400 Bad Request for all errors

- **400** — always return 400 for any error, with a descriptive message
  in the JSON body.
- *How it feels:* The frontend must parse the error message to know
  whether it's "insufficient balance" or "reward not found" — fragile
  string matching. Can't render different UI states without text parsing.

- *When it makes sense:* When the backend team is lazy and doesn't want
  to think about HTTP semantics. The `psycopg2`-backed API already has
  the context to distinguish the cases at the point of failure.

### Option 4: 500 Internal Server Error for insufficient balance

- **500** — treat insufficient balance as an unexpected server error,
  with the message explaining the balance issue.
- *How it feels:* Loses the distinction between a client error (user
  doesn't have enough coins) and a server error (database down). Retry
  mechanisms might kick in for 500s unnecessarily. The frontend would
  show a generic "something went wrong" rather than "you need more coins."

- *When it makes sense:* Never. Insufficient balance is an expected
  operational outcome, not a server fault.

## Reasoning

**Option 1 (distinct HTTP status codes) is the correct choice.**

HTTP status codes exist precisely to let the client distinguish error
types without parsing response bodies. The frontend's `redeemReward()`
function in `client/src/lib/api.ts` already throws an `Error` on any
non-2xx response — it doesn't inspect the status code yet, but the pattern
supports it. The assignment requires "proper validation and error
handling," and using semantically correct HTTP statuses is the textbook
definition of proper error handling in REST APIs.

**Why 402 specifically for insufficient balance?**

HTTP 402 Payment Required is the canonical status for "the request was
valid but the agent doesn't have enough funds." It's underused (most
APIs use 400 or 409) but for this assignment it's semantically perfect:
the user has insufficient coins. The frontend can map `error.status ===
402` to "insufficient balance" and show a targeted message with a link
to the rewards page.

**Why 404 for not-found reward?**

`GET /api/rewards` returns the current catalogue. If a reward ID was
valid when the catalogue loaded but the reward was since removed (e.g.,
by an admin), the redemption should return 404. This is the standard
HTTP semantic for resource-not-found.

**Why 400 for invalid input?**

If the frontend sends `{ reward_id: "abc" }` (non-integer) or
`{ reward_id: -5 }`, Pydantic's request validation will return a 422
Unprocessable Entity (FastAPI's default for type errors). This is
acceptable — the frontend's TypeScript types prevent sending non-integer
IDs, so this is a defensive guard, not a primary path.

## Tradeoffs

- **402 is underused and unusual** — Some HTTP clients and frameworks
  don't have first-class handling for 402. The frontend must ensure its
  `fetch` wrapper doesn't treat 402 as a generic error. Documented in
  `api.ts` and `AI-USAGE.md`.

- **The frontend currently throws on any non-2xx** — The `redeemReward()`
  function in `api.ts` catches the HTTP error and throws a single
  `Error` object. To leverage the status code distinction, the frontend
  would need to catch based on `error.message` or `error.status`. This
  is a frontend decision (tracked in `docs/plutus-client/itds/...`).

- **No retry on 402** — Unlike a 500 (which might warrant a retry), a 402
  means the user needs to earn more coins. The frontend should not retry;
  it should redirect to the transactions table or rewards page.

## Notes

- Error response body format (FastAPI default):
  `{"detail": "Insufficient balance: need 100 coins, have 75"}`
- The frontend's `api.ts` `redeemReward()` function parses this `detail`
  string into the thrown `Error` message.
- Referenced in: `docs/plutus-client/ipds/rewards-mechanics.md` (product
  decision on redemption UX)
