## Problem to solve

The Digital Alpha assignment lists "optimistic balance updates with clean
rollback if redemption fails" as a **nice-to-have**. The current RewardsView
redemption flow is synchronous:

1. User taps "REDEEM"
2. `handleRedeem()` calls `redeemReward(selectedReward.id)` — an async API call
3. On success, `store.setBalance({ ...balance, balance: result.new_balance })`
4. On failure, `store.setRedemptionStatus("error")` + `store.setRedemptionError(err.message)`

The problem: during step 2, the UI shows "CONFIRMING..." but the balance
doesn't change. If the API call fails (e.g., race condition, network error),
the user sees an error but the balance is already in the correct state
(unchanged). However, if the API succeeds but returns an error response
(e.g., "insufficient balance" — the backend rejects with HTTP 400), the
user's balance was never modified optimistically, so the rollback case is
trivial.

The real question is: can we make the UI feel faster by updating the balance
*before* the API confirms, and rolling back if it fails?

## Options

### Option 1: Optimistic balance update with rollback

```ts
const handleRedeem = async () => {
  if (!selectedReward) return
  const cost = selectedReward.coin_cost

  // Snapshot current balance for rollback
  const previousBalance = balance
  store.setRedemptionStatus("confirming")

  // Optimistically update the balance
  store.setBalance({ ...balance, balance: balance.balance - cost })

  try {
    const result = await redeemReward(selectedReward.id)
    // Server confirmed — keep the optimistic update
    store.setBalance({ ...balance, balance: result.new_balance })
    store.setRedemptionStatus("success")
  } catch (err) {
    // Rollback the balance
    store.setBalance(previousBalance)
    store.setRedemptionStatus("error")
    store.setRedemptionError(err instanceof Error ? err.message : "Redemption failed")
  }
}
```

- *How it feels:* The balance updates instantly when the user taps "REDEEM."
  No waiting for the network round-trip. If it fails, the balance animates
  back to the previous value. The "CONFIRMING..." state is replaced by a
  brief "processing" animation.
- *When it works:* When the API is reliable enough that failures are rare,
  and rollback is fast enough to not feel jarring.
- *Source:* React Query / SWR docs on optimistic updates.

### Option 2: Synchronous with loading state (current approach)

The balance doesn't change until the API responds. The user sees "CONFIRMING..."
and waits. If it fails, nothing changed — no rollback needed.

- *How it feels:* Slower but safe. No risk of a flash-of-wrong-balance.
- *When it works:* When the API is slow and the user needs to see a clear
  "waiting" state.

### Option 3: Keep balance unchanged, update coin count optimistically

Instead of deducting coins immediately, show a "pending" state on the balance
(slightly dimmed or with a "(pending)" suffix). The coin balance stays at the
old value until the API confirms.

- *Cost:* Adds a "pending" UI state which is more complex than a simple
  balance number.

## Reasoning

**Option 1 (optimistic balance update with rollback) is the best choice.**

The Setproduct guide and the assignment both push for perceived performance:
"Virtualization is a performance tool, not only a UX one" and the bonus item
specifically asks for "optimistic balance updates with clean rollback."

### Why optimistic

1. **Perceived performance** — the balance updates immediately when the user
   taps "REDEEM." This eliminates the network round-trip latency from the
   user's perception. On a fast connection this is ~200ms saved; on a slow
   connection it's seconds.

2. **Confidence** — the user sees their action has an immediate effect. This
   is the "micro-interaction" principle from the `fintech-ui-2026` skill:
   "confirm actions (button press → ripple → result)."

3. **The rollback path is simple** — if the API fails, we restore the
   previous balance object. The `catch` block calls `store.setBalance(previousBalance)`,
   which is a single Zustand mutation.

4. **Backend already validates** — the FastAPI backend rejects invalid
   redemptions (insufficient coins, reward doesn't exist) with HTTP 400.
   The optimistic update is safe because the backend is the source of truth —
   if it rejects, we roll back.

### Why not keep synchronous (Option 2)

The current approach feels slow, especially on slow networks. The user taps
"REDEEM" and sees "CONFIRMING..." with no feedback. The optimistic approach
gives immediate visual feedback and only rolls back on error.

### Why not pending state (Option 3)

Adding a "pending" visual state is more complex than needed. The optimistic
update + rollback is a well-understood pattern (React Query does this by
default for mutations).

## Implementation

The key changes in `RewardsView.tsx`:

```ts
const handleRedeem = async () => {
  if (!selectedReward || !balance) return
  const cost = selectedReward.coin_cost

  // Snapshot for rollback
  const previousBalance = { ...balance }

  // Optimistically deduct coins
  store.setRedemptionStatus("confirming")
  store.setBalance({ ...balance, balance: balance.balance - cost })

  try {
    const result = await redeemReward(selectedReward.id)
    store.setBalance({ ...balance, balance: result.new_balance })
    store.setRedemptionStatus("success")
    // Keep the selectedReward or clear it?
    // → Clear it: the redemption is complete
    store.setSelectedReward(null)
  } catch (err) {
    // Rollback: restore previous balance
    store.setBalance(previousBalance)
    store.setRedemptionStatus("error")
    store.setRedemptionError(
      err instanceof Error ? err.message : "Redemption failed",
    )
  }
}
```

### Visual feedback on rollback

To make the rollback visually clear (not jarring), we could add a brief
animation:

```tsx
// When redemptionStatus transitions from "error" → "idle" after a brief delay
// animate the balance text with a "shake" or "pulse" to signal the rollback
```

However, this is a polish detail. The basic rollback (restore balance) is
sufficient for the assignment.

## Tradeoffs

- **Flash of incorrect balance** — if the API fails, the user briefly sees
  a lower balance before it snaps back. This is the standard optimistic
  update tradeoff. To mitigate: the error message appears prominently, and
  the balance "snap back" is instantaneous (<100ms on a local demo).
- **Double-spend risk** — if the user taps "REDEEM" twice rapidly, the
  second tap deducts from the already-deducted balance. Mitigation: disable
  the button during "confirming" state (already implemented via
  `disabled={redemptionStatus === "confirming"}`).
- **Backend must be idempotent** — if the API call succeeds but the response
  is lost (network timeout), the server may have processed the redemption.
  The user's balance would be wrong. For this assignment, the backend is
  assumed to be reliable; production would need idempotency keys.
- **Selected reward** — after success, should we clear the selected reward?
  Yes — the redemption is complete, and showing "CONFIRMING → REDEEM" again
  would be confusing.

## Notes

- **Two-cache write-through requirement (found in use)**: state flows
  SWR → Zustand via the sync effect in `page.tsx`. An optimistic update that
  writes ONLY the Zustand store leaves the SWR `/api/balance` cache stale;
  every later SWR-driven sync resurrects pre-redeem values, so redemption
  effects appeared only after a manual reload. On success, `handleRedeem`
  now fetches the authoritative CoinBalance and writes it through both:
  `store.setBalance(fresh)` + `mutate("/api/balance", fresh, { revalidate:
  false })`. This also fixes stale `total_earned` / `total_redeemed`, which
  the old `{ ...balance, balance: result.new_balance }` spread never updated.
- The current synchronous flow is in `src/components/rewards/RewardsView.tsx`
  lines 11-25 (the `handleRedeem` function).
- The rewards store is in `src/stores/rewards-store.ts` — has `setBalance`,
  `setRedemptionStatus`, `setRedemptionError`, `setSelectedReward`.
- The API call is `redeemReward(rewardId: number)` in `src/lib/api.ts`.
- Referenced in: `docs/table-performance-enhancement/intro.md`
