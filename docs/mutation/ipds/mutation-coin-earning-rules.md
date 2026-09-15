## Problem to solve

Coin earning is automatic — users cannot directly set or edit `coins_earned`. The rules differ by transaction type:
- **Type 1 (payment)**: 1 coin per ₹100 spent, capped at 50 per transaction, only for SUCCESS status with positive amounts.
- **Type 2 (manual)**: Always 0 coins, regardless of amount, status, or any other field.

This must be transparent in the UI so users understand how their actions affect rewards.

## Options

### **Option 1: Type-aware coin preview in form, coins are read-only (recommended)**
- Create/edit form shows a live "Coins earned: X" preview that updates as user types amount/status.
- For **Type 1**: Preview shows calculated coins (1 coin/₹100, cap 50, 0 if not SUCCESS or amount ≤ 0).
- For **Type 2**: Preview shows "0 coins (manual transactions don't earn coins)" — disabled, informational.
- `coins_earned` field is not in the form — it's computed server-side and returned in response.
- Help text explains: "Payment transactions (Type 1) earn 1 coin per ₹100, max 50, only when successful. Manual transactions (Type 2) don't earn coins."

### Option 2: No preview, coins shown only after save
- Form has no coin preview.
- After submit, response includes `coins_earned`, shown in toast or transaction row.
- Simpler form, but less transparency — users won't understand why Type 1 earns coins and Type 2 doesn't.

### Option 3: Allow user to override coins (admin/debug mode)
- Form includes editable `coins_earned` field (hidden by default, shown with a toggle).
- Useful for testing, but contradicts "automatic earning" principle.
- Not for production users.

## Reasoning

Coin earning is a core reward mechanic — users need to understand it to engage. A live preview (Option 1) makes the system feel responsive and fair: "if I spend ₹5000 via the app, I get 50 coins." It also prevents confusion when a Type 1 PENDING transaction earns 0 coins but SUCCESS earns 50. For Type 2, showing "0 coins (manual transactions don't earn coins)" educates users about the two-type model. The rules are simple enough to explain in one line of help text. Option 3 (override) is for admin only — not in v1 scope.

## Tradeoffs

- Preview adds minor frontend complexity (recompute on amount/status/type change) — but the logic is already in `validation.ts`.
- Must ensure server-side calculation is authoritative — preview is advisory only.
- Help text must be clear: "Coins are awarded automatically based on transaction type, amount, and status."