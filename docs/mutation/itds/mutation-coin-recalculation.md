# Mutation Coin Recalculation — ITDs

| ITD 3 - "Recalculate coins for the mutated transaction only; Type 2 always 0; Type 1 blocked from amount/status edits so no recalculation on edit; update user balance via derived query (SUM coins_earned - SUM coins_spent); no stored balance column." |  |
| :---- | :---- |
| **THE PROBLEM** | When a transaction is created, updated, or deleted, the user's coin balance must reflect the change. The balance is currently derived: `SUM(transactions.coins_earned) - SUM(redemptions.coins_spent)`. With two transaction types:
- **Type 1 (payment)**: Coins earned per rules. Amount/status edits blocked → no recalculation on edit. Delete blocked → no coin deduction.
- **Type 2 (manual)**: Always 0 coins. Create/edit/delete never affects coin balance.
The question is whether to recalculate only the changed transaction's coins, or recompute all transactions, and whether to store balance or keep it derived. |
| **OPTIONS CONSIDERED (Decision in bold)** | |
| **Option 1** | **On create (Type 2): compute `coins_earned = 0`, store it on the row. On update (Type 2): `coins_earned` remains 0 (no recalc needed). On update (Type 1): only merchant/category allowed → no coin recalculation. On delete (Type 2): row removed, its `coins_earned` (0) no longer counted. On delete (Type 1): blocked. Balance always derived at read time: `SELECT COALESCE(SUM(coins_earned),0) FROM transactions WHERE user_id=?` minus `SELECT COALESCE(SUM(coins_spent),0) FROM redemptions WHERE user_id=?`. No `coin_balance` column in any table.** | **REASONING** |
| **Create (Type 2)** | Insert transaction with `coins_earned = 0`. Subsequent `/api/balance` reads new sum automatically. | **TRADEOFFS** |
| **Update (Type 2)** | `coins_earned` stays 0. No computation needed. Balance unchanged. | |
| **Update (Type 1)** | Only merchant/category allowed → amount/status unchanged → coins unchanged. No computation needed. | |
| **Delete (Type 2)** | Delete row. Its `coins_earned` (0) no longer counted in sum. Balance unchanged. | |
| **Delete (Type 1)** | Blocked (403). No balance impact. | |
| **Read** | `/api/balance` does two SUM queries — fast with `idx_transactions_user_id` and `idx_redemptions_user_id`. | |
| **Option 2** | Recompute ALL user transactions' coins on every mutation (full backfill). Overkill for single-row changes. | |
| **Option 3** | Store `coin_balance` on a `user_profiles` table (or new table), update it incrementally on each mutation. Adds write complexity, denormalization risk. | |
|  | Derived balance is the current architecture (no `user_profiles`, no stored balance). Single-row coin calc is O(1), SUM queries are O(indexed rows) — fast enough for demo scale. No denormalization, no sync bugs. Full recompute (Option 2) wastes CPU. Stored balance (Option 3) adds a table we just removed and creates sync issues. With Type 2 always 0 and Type 1 edits blocked from coin-affecting fields, coin recalculation on mutation is effectively a no-op for v1 — the balance only changes when new Type 1 transactions are added (via future payment flow) or rewards are redeemed. | |
|  | References: `docs/mutation/intro.md` (Open question 3), `docs/mutation/ipds/mutation-transaction-types.md`, `docs/mutation/ipds/mutation-type1-semi-immutable.md`, `server/main.py` (get_balance endpoint), `server/schema.sql` (no user_profiles, no coin_balance column). | |