## Problem to solve

Type 1 transactions (app-initiated payments) represent real payments that happened. They earn coins based on amount/status. They should be protected from edits that would change their coin-earning attributes, but allow corrections to metadata (merchant name, category) that don't affect coins.

## Options

### **Option 1: Field-level edit permissions (recommended)**
- **Allowed edits for Type 1**: `merchant`, `category` only.
- **Blocked edits for Type 1**: `amount`, `status`, `payment_method`, `currency`, `timestamp`, `id`, `user_id`, `transaction_type`.
- On PUT `/api/transactions/{id}` for Type 1:
  - If request body contains any blocked field with a *different* value → 400 error: "Field 'amount' cannot be modified on payment transactions (Type 1)."
  - If only allowed fields changed → proceed, update row, no coin recalculation needed.
- DELETE `/api/transactions/{id}` for Type 1 → 403 Forbidden: "Payment transactions cannot be deleted. They represent completed payments."

### Option 2: Versioned/immutable with correction log
- Type 1 transactions are truly immutable (no edits at all).
- User creates a "correction" transaction (Type 2) with negative amount to offset, or a separate `corrections` table links to original.
- Over-engineered for demo scope. Adds complexity to balance calculation and UI.

### Option 3: Soft delete / archive for Type 1
- Type 1 cannot be edited or hard-deleted.
- User can "archive" (hide from default view) via `archived BOOLEAN DEFAULT FALSE`.
- Archive doesn't affect coins — balance still includes archived transactions.
- Adds UI complexity (archive toggle, show/hide archived) for marginal benefit.

## Reasoning

Type 1 transactions are receipts of real payments. Changing `amount` or `status` would retroactively alter coin earnings, breaking the "coins follow transactions" principle and potentially creating negative balances (see `mutation-coin-balance-protection.md`). However, merchants often have messy names in bank feeds ("AMZN MKTP US*2X3Y4Z" vs "Amazon"), and categories are subjective — correcting these is a legitimate user need that doesn't affect coins. Blocking `DELETE` entirely prevents users from "erasing" a payment they made, which would be dishonest. Option 1 strikes the right balance: protect the financial truth, allow metadata cleanup.

## Tradeoffs

- Frontend must disable blocked fields in edit form for Type 1 (visual indication: disabled inputs, tooltip "Cannot edit payment amount").
- API validation logic per-type (shared validation module handles this).
- Users may be confused why some fields are editable and others not — mitigate with clear UI hints.
- If a Type 1 transaction has wrong amount/status (data entry error from webhook), admin intervention needed — acceptable for demo.