## Problem to solve

The rewards system must define how users earn coins on payments, display their balance, and redeem coins against a catalogue of 4–6 rewards. Key questions: how is the per-transaction coin cap defined, how is balance persisted, what rewards to offer, and how the redemption flow (3-step: Select → Confirm → Done) handles failures.

## Options

### Option 1: Coins earned per transaction, capped at a fixed maximum per transaction
Users earn 1 coin per ₹100 spent. A per-transaction cap (e.g., max 50 coins per transaction, regardless of amount) limits the reward rate. Balance is stored persistently (per-user in the database).

- *How it feels:* Predictable earning rate for small transactions. High-value transactions don't yield proportionally more coins — the cap acts as a throttle.
- *When it makes sense:* When you want to limit reward payout as a percentage of revenue, or simulate a real program with per-transaction limits.

### Option 2: No per-transaction cap — coins scale linearly with spend
Users earn 1 coin per ₹100 spent with no cap. A ₹50,000 transaction yields 500 coins. Balance is computed from transaction history or stored as a running total.

- *How it feels:* Higher-value transactions feel more rewarding. Simpler mental model: "1 coin per ₹100, period."
- *When it makes sense:* When simplicity and predictability of the formula matter more than reward cost control.

### Option 3: Tiered earning based on card type or category
Different merchant categories or card types earn different coin rates (e.g., 1.5 coins per ₹100 on fuel, 0.5 on groceries). Adds complexity but mirrors real-world reward programs.

- *How it feels:* More nuanced and "premium" feeling, but harder to explain quickly.
- *When it makes sense:* When the dataset includes card type or merchant category data and you have time to implement category-specific logic.

## Coins per ₹100 — the cap value

The assignment says "Coins are capped per transaction" but doesn't specify the cap amount. This is a product decision:

- **₹500 spend threshold** (cap = 5 coins per transaction): Matches the "1 coin per ₹100" formula up to ₹500 spend. Beyond that, no additional coins. Conservative on reward cost.
- **₹5,000 spend threshold** (cap = 50 coins per transaction): More generous, allows high-value transactions to earn meaningfully.
- **No explicit cap, but daily/weekly cap**: Instead of per-transaction, cap total coins earned per day or week.

For the **foundation**, a simple fixed per-transaction cap (e.g., 50 coins = ₹5,000 spend worth) is recommended — it's easy to explain, easy to implement, and gives the cap mechanic the assignment requires.

## Rewards catalogue

The assignment says to define 4–6 rewards such as vouchers, cashback, or "other suitable rewards." Options to explore:

- **Cashback voucher** (e.g., ₹100 cashback for 500 coins)
- **Merchant voucher** (e.g., ₹500 Amazon/Flipkart voucher for 800 coins)
- **Bill discount** (e.g., 10% off next bill payment for 200 coins)
- **Data boost** (e.g., 1GB mobile data voucher for 150 coins)
- **Charity donation** (round up coins to donate to a cause — goodwill)
- **Premium feature trial** (e.g., 1-month premium for 300 coins)

For the foundation, the catalogue content and coin pricing are open questions to be resolved during implementation. The mechanism — select, confirm, done — and failure handling are the structural decisions.

## Redemption flow & failure handling

Three steps: Select (choose a reward), Confirm (review and approve), Done (success screen).

- On **insufficient balance**: the confirm step should show the user's current balance upfront, and the backend must reject via HTTP 400/402 before any state changes.
- On **invalid reward ID**: backend rejects via HTTP 404. The UI should handle this by showing a clean error message and disabling already-completed steps.
- **Balance consistency**: the balance update must be atomic with the redemption record. If redemption fails after a partial update, balance must roll back.

For the foundation, the key decisions are:
1. **Where is balance stored**: persisted in the database (not computed from transactions), so it survives even if redemption logic changes.
2. **Balance update strategy**: optimistic update with rollback on failure (bonus feature) vs. synchronous update (simpler, safer).
3. **Redemption transaction semantics**: the backend treats redemption as a single atomic operation — deduct coins + create redemption record, or reject entirely.

## Reasoning

- **Fixed per-transaction cap** (e.g., 50 coins) is the simplest way to satisfy the assignment's "capped per transaction" requirement while keeping the earning formula readable.
- **Balance stored in DB** (not computed) avoids recomputation and handles edge cases (manual adjustments, refunds) more gracefully.
- **Synchronous balance update** (no optimistic updates in the foundation) is safer and simpler — the assignment lists optimistic updates as a "nice to have," so synchronous is the pragmatic baseline.
- The 3-step flow (Select → Confirm → Done) is mandated by the assignment; the question is whether "Confirm" shows coin cost + remaining balance, which is a UI detail.

## Tradeoffs

- **Simple cap vs tiered earning**: Tiered earning is more realistic but adds complexity that may not be rewarded in a 24-hour assignment.
- **Computed vs stored balance**: Computed is "pure" (always correct relative to transactions) but fragile if redemption logic changes. Stored is practical but requires consistency guarantees.
- **Optimistic vs synchronous updates**: Optimistic feels faster but risks edge-case bugs in rollback logic. Synchronous is boringly correct.

## Notes

This decision is coupled with the **ITD: PostgreSQL schema** — balance storage strategy determines whether we need a `user_coins` table with a running balance or can compute from a `redemptions` table. The coin earning formula is also tied to the **transaction data model** (which transactions count as "payments" worth coins).
