| ITD 2 - "Use a single database transaction for atomic reward redemption." |  |
| :---- | :---- |
| **THE PROBLEM** | When a user redeems a reward, the backend must (1) verify the reward exists, (2) check the user's coin balance is sufficient, (3) deduct the cost from the balance, and (4) log the redemption in an audit table. If this sequence is split across multiple database calls without a transaction, a concurrent request could observe a stale balance and overdraft. The frontend needs clear HTTP status codes to distinguish success from insufficient-balance vs. invalid-reward. The question is: how to guarantee atomicity and communicate outcomes to the frontend. | **OPTIONS CONSIDERED (Decision in bold)** |
| **Option 1** | **Single PostgreSQL transaction wrapping all four steps.** Use `with conn:` (psycopg2's context manager) to ensure the entire sequence commits or rolls back atomically. Return HTTP 402 for insufficient balance, 404 for reward-not-found, and 200 with the new balance on success. |
| **Option 2** | Separate database calls with manual balance check. Read balance → check → UPDATE → INSERT. No explicit transaction boundary. |
| **Option 3** | Optimistic locking — add a `version` column to the users table, check it on update, retry on conflict. |
| **Option 4** | Application-level locking — use `SELECT FOR UPDATE` to lock the user row before checking balance. | **REASONING** |
| **Why single transaction** | A single `with conn:` block in psycopg2 automatically commits on success and rolls back on exception. Within this transaction, the balance is read and updated atomically — there is no window for another request to observe a stale balance. The four steps (verify reward → check balance → deduct → log) execute as one indivisible unit. This guarantees that concurrent redemptions either succeed or both see the updated balance. The transaction approach is the simplest correct solution and matches the assignment's expectation of "proper validation and error handling." |
| **Why not separate calls** | Without a transaction, a concurrent request could read the same balance before the first request's UPDATE commits (the classic read-modify-write race). Both requests would pass the balance check, both would deduct, and the user could end up with a negative balance. The transaction eliminates this window entirely. |
| **Why not optimistic locking** | Optimistic locking adds complexity (version column, retry loops) for a single-user demo where concurrent redemptions are unlikely. The single-request-per-user model makes pessimistic locking within a transaction sufficient and simpler. |
| **Why not SELECT FOR UPDATE** | `SELECT ... FOR UPDATE` achieves the same isolation as the transaction approach but requires the caller to manage lock lifecycle explicitly. The implicit row lock acquired by `UPDATE users SET coin_balance = ... WHERE id = ... ORDER BY id LIMIT 1` within a transaction is cleaner and sufficient for this use case. | **TRADEOFFS** |
| | | - The transaction holds a row lock on the users table for the duration of the redemption request. If a redemption takes a long time (unlikely), concurrent redemptions would queue. For a demo with 10k rows and <5ms per operation, this is irrelevant. |
| | | - HTTP 402 (Payment Required): MDN describes 402 as "reserved for future use" |
| | | but it is the canonical status for payment/credit scenarios. Research |
| | | ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/402), |
| | | [StackExchange discussion](https://softwareengineering.stackexchange.com/questions/436150)) |
| | | confirms it is acceptable and semantically precise for "insufficient funds." |
| | | Some HTTP clients lack first-class 402 handling, but the frontend's `fetch`|
| | | wrapper treats it as a standard HTTP error — no special handling needed. |
| | | - No retry logic on deadlock — if PostgreSQL raises a serialization failure (rare at this scale), the request returns a 500. Documented as a known limitation. | **NOTES** |
| | | - Redemption flow within `/api/redeem`: |
| | |   1. `SELECT id, name, coin_cost FROM rewards WHERE id = %s` → 404 if not found |
| | |   2. `SELECT id, coin_balance FROM users ORDER BY id LIMIT 1` → 404 if no user |
| | |   3. If `balance < coin_cost` → raise HTTP 402 |
| | |   4. `UPDATE users SET coin_balance = %s WHERE id = %s` |
| | |   5. `INSERT INTO redemptions (user_id, reward_id, coins_spent) VALUES (%s, %s, %s)` |
| | |   6. `conn.commit()` → return `RedeemResponse(success=True, new_balance, message)` |
| | | - On any exception: `conn.rollback()` is automatic via the `with conn:` context manager |
| | | - Referenced in: `docs/plutus-client/ipds/rewards-mechanics.md` (product decision on error UX) |
