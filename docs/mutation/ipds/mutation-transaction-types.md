## Problem to solve

Plutus now has two fundamentally different transaction types with different mutation rules and coin earning behavior. We need to represent this distinction in the database schema, API contracts, and frontend models so that the system can enforce type-aware behavior at every layer.

## Options

### **Option 1: Single `transaction_type` column with CHECK constraint (recommended)**
- Add `transaction_type TEXT NOT NULL CHECK (transaction_type IN ('type_1_payment', 'type_2_manual'))` to `transactions` table.
- Default: `type_1_payment` (for backward compatibility with seed data).
- Seed script explicitly sets `type_1_payment` for all 9,960 transactions.
- POST `/api/transactions` accepts `transaction_type` in body (defaults to `type_2_manual` for user-created).
- API enforces: Type 1 cannot be created via POST (separate flow later); Type 2 only.
- Frontend `Transaction` interface includes `transaction_type` field.

### Option 2: Separate tables (`payments` vs `manual_transactions`)
- `payments` table for Type 1 (immutable-ish, has coins_earned, linked to payment gateway).
- `manual_transactions` table for Type 2 (fully mutable, no coins).
- UNION view or application-level merge for combined display.
- Clean separation but duplicates schema, complicates queries (analytics, balance, filters across both).

### Option 3: Boolean flag `is_manual BOOLEAN DEFAULT FALSE`
- `TRUE` = Type 2 (manual, mutable, no coins), `FALSE` = Type 1 (payment, semi-immutable, coins).
- Simpler than enum but less self-documenting. "is_manual" vs "is_payment" naming ambiguity.
- CHECK constraint still needed to prevent invalid states.

## Reasoning

A single table with a typed column (Option 1) keeps the query surface simple — all existing endpoints (`GET /api/transactions`, analytics, balance) continue working with just a `WHERE user_id = ?` filter. The CHECK constraint enforces validity at the database level. The enum values `type_1_payment` / `type_2_manual` are self-documenting in logs, queries, and frontend code. Option 2 over-engineers for a demo — the shared fields (merchant, category, amount, timestamp, status, payment_method, user_id) are identical; only mutation rules and coin logic differ. Option 3's boolean is less clear (`is_manual: true` vs `is_payment: false` — which is the default?).

## Tradeoffs

- Migration needed: `ALTER TABLE transactions ADD COLUMN transaction_type ...` with default for existing rows.
- Seed script must be updated to set type explicitly (idempotent re-runs still work).
- Frontend type union: `Transaction['transaction_type'] = 'type_1_payment' | 'type_2_manual'`.
- API validation must check type on every mutation endpoint.