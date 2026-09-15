## Problem to solve

With the two-type model, coin balance protection changes significantly:
- **Type 1 (payment)**: Amount/status edits are blocked (see `mutation-type1-semi-immutable.md`), so coin recalculation on edit never happens. Coins only change if a Type 1 transaction is deleted (which is blocked).
- **Type 2 (manual)**: Always earns 0 coins. Creating/editing/deleting Type 2 transactions never affects coin balance.

The only way coin balance changes from mutations:
1. Type 1 deleted (blocked in v1) → would deduct its `coins_earned` from balance.
2. Type 1 amount/status changed (blocked in v1) → would recalc coins.
3. Type 2 operations → no coin impact (always 0).

Since v1 blocks the only mutation paths that could reduce earned coins, **negative balance from mutation is impossible**. However, negative balance can still occur if a user redeems coins, then a Type 1 transaction is corrected via admin action (out of scope). We still need a policy for that edge case.

## Options

### **Option 1: Allow negative balance (recommended)**
- Mutation succeeds even if new `coins_earned` < historical `coins_spent` (theoretical, since blocked in v1).
- Balance shows negative (e.g., -99 coins).
- User must earn more coins (new Type 1 transactions) to recover.
- Simple: no extra checks, no blocked edits, no complex logic.
- Transparent: balance formula is always `earned - spent`, no exceptions.

### Option 2: Block mutation if it would make balance negative
- On edit/delete: compute prospective new balance.
- If `new_total_earned - total_spent < 0`, reject with 400: "Cannot reduce transaction — would make coin balance negative (spent: X, would earn: Y)."
- User must "un-redeem" (not possible) or earn more first.
- Protects against negative balance but blocks legitimate edits.

### Option 3: Auto-revert redemptions (not feasible)
- If edit would make balance negative, automatically undo recent redemptions.
- Complex: which redemptions? What if rewards were consumed? Not viable.

### Option 4: Warn but allow
- Show warning in UI: "This edit will make your coin balance negative (-99). Continue?"
- Backend still allows it (same as Option 1).
- UI-only guardrail.

## Reasoning

With Type 1 amount/status edits blocked and Type 2 earning 0 coins, mutation-induced negative balance is impossible in v1. The only path to negative balance is: user redeems coins → admin later corrects a Type 1 transaction's amount/status (out of scope). For this rare edge case, Option 1 is simplest and most honest — the formula `earned - spent` always holds. Users understand "I spent coins I no longer have, I need to earn more." Option 2 blocks valid corrections. Option 4 adds UI complexity for a rare edge case. For a demo, Option 1 is fine — negative balance is a clear signal, not a bug.

## Tradeoffs

- Negative balance may confuse users ("how can I have -99 coins?") — mitigate with UI: show "Coins owed: 99" or similar.
- No enforcement means users can "overspend" retrospectively — but they can't game it (editing down doesn't give them coins, only takes away).
- If this becomes a real product, Option 2 or a "coins reserve" model would be needed — but not for v1.