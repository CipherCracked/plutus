## Problem to solve

The seed script must establish the default user's initial coin balance. This is not just a technical calculation — it's a product decision about how the user perceives their starting balance. The balance must be computed from the transaction dataset (1 coin per ₹100 spent on successful payments, capped at 50 per transaction), but the formula and edge cases shape the user's first impression of the rewards program.

## Options

### Option 1: Pre-compute and store the aggregate balance at seed time
Sum `coins_earned` across all SUCCESS transactions and store the total in a `users` table. The balance is a snapshot — it reflects the state of the dataset at seed time and doesn't recompute at runtime.

- *How it feels:* The user opens the app and sees "Your balance: X coins" immediately. No loading spin, no computation delay.
- *When it makes sense:* When the dataset is static and doesn't change after seeding.

### Option 2: Compute balance on-the-fly from the coins_ledger table
Store `coins_earned` per transaction in the `transactions` table, plus a `redemptions` table for spent coins. The balance is `SUM(coins_earned) - SUM(coins_spent)` computed at query time via the backend API.

- *How it feels:* The balance is always "live" and accurate. But the first API call to `GET /coin-balance` takes longer (sums 10k rows).
- *When it makes sense:* When transactions or redemptions can change after seeding (live system).

### Option 3: Hybrid — store balance in a column but recompute on seed re-runs
Store the balance in the `users` table as a column (for fast reads), but if the seed script runs again (e.g., after data changes), it truncates and recomputes from scratch.

- *How it feels:* Best of both — instant balance reads, and the seed script is the source of truth.
- *When it makes sense:* When you want fast runtime reads but need the ability to re-seed with updated data.

## Reasoning

For this 24-hour assignment, the dataset is **static** — it comes from `transactions.json` and doesn't change during the demo. This makes **Option 1 (pre-computed aggregate)** the strongest foundation because:

- It's the simplest to implement in the seed script — one SUM query after inserting all transactions.
- It's the fastest at runtime — the backend API just reads a single balance value.
- It aligns with the ITD (postgresql-schema) decision: a `users` table with a `coin_balance` integer column.

**Option 2 (on-the-fly computation)** is the "proper" approach for a live system, but it requires the backend to run `SUM(coins_earned) - SUM(coins_spent)` on every balance request, which is wasteful when the data doesn't change. It also couples the balance to the transaction table's integrity — if a transaction is deleted, the balance silently changes.

**Option 3 (hybrid)** is the ideal long-term approach, but for the foundation, the extra complexity of re-seed detection adds risk in a 24-hour window.

## Tradeoffs

- **Option 1**: Fast reads, simple, but balance could drift if transactions are modified outside the seed script (not a concern for this assignment).
- **Option 2**: Always accurate, but slow first read and tightly coupled to transaction integrity.
- **Option 3**: Best correctness, but requires the seed script to handle delta updates (what changed since last seed), which is non-trivial in 24 hours.

## Notes

The coin calculation itself is straightforward: for each transaction with `status = "SUCCESS"`, `coins_earned = LEAST(FLOOR(amount / 100), 50)`. Negative amounts (refunds) earn 0 coins. PENDING and FAILED transactions earn 0 coins. The aggregate balance is `SUM(coins_earned)` across all qualifying transactions.

This decision is tightly coupled to the **ITD: data-quality-normalization.md** (which covers status normalization — only properly normalized "SUCCESS" transactions should earn coins) and the **ITD: postgresql-schema.md** (the `users` table schema for storing the balance).
