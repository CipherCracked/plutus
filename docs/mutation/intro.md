# Transaction Mutation — Problem Decomposition

## Problem statement

Plutus is currently a read-only demo: users can view transactions, check balances, browse rewards, and redeem them — but they cannot add, edit, or delete their own transactions. The dataset is static (`transactions.json` seeded at startup). To make Plutus a functional spending tracker that users can actually use, we need transaction mutation: create, update, and delete operations on user-scoped transactions.

**Critical clarification:** There are **two distinct transaction types** with fundamentally different mutation rules:

- **Type 1: App-initiated payments** — Created when user pays a bill through the app (or via webhook from payment gateway). These earn coins (1 coin/₹100, cap 50, SUCCESS only). **Semi-immutable**: merchant/category corrections allowed; amount/status changes that affect coins are blocked.
- **Type 2: Manual spend tracking** — User manually adds a transaction for tracking purposes. **Zero coins always**. **Fully mutable**: create, edit, delete freely.

All 9,960 seed transactions are Type 1 (historical payments).

## Background and context

- Plutus was built as a 24-hour assignment with a fixed dataset and no user-facing mutation capabilities.
- The backend now has multi-user authentication via Supabase Auth (direct UUID in `transactions.user_id`). All existing endpoints (`GET /api/transactions`, `/api/balance`, `/api/rewards`, `/api/redeem`, `/api/analytics`) are protected and user-scoped.
- The schema (`server/schema.sql`) uses `transactions` table with `user_id TEXT` (Supabase UUID), `id TEXT` (client-provided or generated), and standard transaction fields.
- The seed script (`server/seed.py`) loads 9,960 transactions from `transactions.json` for the default user.
- The frontend (Next.js + TypeScript, Zustand, SWR, Chart.js) displays transactions in a virtualized table with overlays for detail views.
- Documentation workflow (`CLAUDE.md`): every feature starts with `intro.md`, builds a focused problem tree, creates IPDs/ITDs, then implements.

## Goals

- Add `transaction_type` column to `transactions` table (type_1_payment | type_2_manual).
- Enable users to **create Type 2 transactions** via a form (POST `/api/transactions`).
- Enable users to **edit Type 2 transactions** fully (PUT `/api/transactions/{id}`).
- Enable users to **delete Type 2 transactions** (DELETE `/api/transactions/{id}`).
- For **Type 1 transactions**: allow merchant/category edits only; block amount/status changes; allow delete? (open question — likely block delete too since they represent real payments).
- Recalculate coin balance automatically when Type 2 transactions are added/modified/deleted (Type 1 coin recalculation only on allowed merchant/category edits — which don't affect coins).
- Validate input: timestamp normalization (reuse existing logic), duplicate ID prevention, amount/category/merchant required, coin earning rules consistent with seed logic.
- Maintain user isolation: users can only mutate their own transactions.
- Update frontend UI: add transaction form (Type 2 only), inline edit (type-aware), delete confirmation.
- Preserve existing read-only functionality — no regression.
- Seed idempotency must not be broken — re-running seed should not conflict with user-created transactions.

## Non-goals

- **Type 1 creation flow** (in-app "Pay Bill" or webhook) — deferred, logged in `ideas.md`.
- Bulk import (CSV, OFX, bank API sync) — out of scope for v1.
- Audit trail / history of changes — not needed for demo.
- Multi-user editing of the same transaction — single-user per account.
- Recurring transactions / scheduled entries — separate feature.
- Attachments (receipts, images) — out of scope.
- Offline-first / optimistic UI with background sync — keep it simple for now.

## Constraints

- Must use existing tech stack: FastAPI, PostgreSQL (Supabase), Next.js, TypeScript, Tailwind v4, Zustand, SWR, Chart.js.
- Must follow documentation workflow: `intro.md` → problem tree → IPDs → ITDs → implementation.
- Must reuse existing timestamp normalization and coin calculation logic from `seed.py`.
- Must respect user isolation: all mutations scoped by `user_id` from JWT.
- Must keep API contracts consistent: `Transaction` model in `models.py` shared with frontend.
- Seed idempotency must not be broken — re-running seed should not conflict with user-created transactions.

## Assumptions

1. Transaction IDs are client-generated (UUID) or server-generated if not provided.
2. **Coin earning is automatic and derived from transaction data — not user-controlled.** Rules: 1 coin per ₹100 spent, capped at 50 per transaction, only for SUCCESS transactions with positive amounts (same as `seed.py`). **Type 1 follows this; Type 2 always earns 0.**
3. Editing a Type 2 transaction recalculates coins (always 0) and updates user balance automatically.
4. Deleting a Type 2 transaction removes its `coins_earned` (0) from the user's balance — no balance impact.
5. Editing a Type 1 transaction's merchant/category does NOT recalculate coins (amount/status unchanged).
6. The `transactions.json` seed data remains the starting dataset for the default user — all seeded as Type 1.
7. Frontend form validation mirrors backend validation.
8. No soft delete — hard delete is fine for this scope.
9. Type 1 delete: blocked (they represent real payments that happened).

## Problem tree

```text
How should transaction mutation work in Plutus with two transaction types?
├── What are the transaction types and their mutation rules?
│   ├── Type 1: app-initiated payments (coins earned, semi-immutable)
│   │   ├── Allowed edits: merchant, category
│   │   ├── Blocked edits: amount, status, payment_method, currency, timestamp
│   │   └── Delete: blocked (represents real payment)
│   └── Type 2: manual spend tracking (zero coins, fully mutable)
│       ├── Allowed edits: all fields
│       └── Delete: allowed
├── How to represent type in schema and API?
│   ├── Add `transaction_type` column (type_1_payment | type_2_manual)
│   ├── Seed script sets type_1_payment for all 9960 transactions
│   ├── POST /api/transactions defaults to type_2_manual (or explicit in body)
│   └── Response includes transaction_type for UI behavior
├── What are the mutation operations and their API contracts?
│   ├── POST /api/transactions — create (Type 2 only; Type 1 via separate flow later)
│   │   ├── Required fields: merchant, category, amount, timestamp, status, payment_method
│   │   ├── Optional: id (auto-generate if missing), currency (default INR)
│   │   ├── transaction_type: type_2_manual (enforced)
│   │   └── coins_earned: computed server-side (0 for Type 2)
│   ├── PUT /api/transactions/{id} — update (type-aware validation)
│   │   ├── Type 1: only merchant, category allowed
│   │   ├── Type 2: all fields allowed
│   │   └── Recalculate coins only if amount/status changed (Type 2 only; Type 1 blocked)
│   └── DELETE /api/transactions/{id} — delete (type-aware)
│       ├── Type 1: 403 Forbidden
│       └── Type 2: allowed, deduct coins_earned (0) from balance
├── How should validation work?
│   ├── Timestamp normalization (reuse seed.py logic)
│   ├── Required fields per type
│   ├── Duplicate ID handling (reject vs generate new)
│   ├── Coin calculation consistency with seed
│   └── Type-specific field edit permissions
├── How does coin earning work? (automatic, not user-controlled)
│   ├── Type 1: 1 coin/₹100, cap 50, SUCCESS only, positive amounts
│   ├── Type 2: always 0 coins
│   ├── Should users see coin preview before submitting? (yes for Type 1, N/A for Type 2)
│   └── Can users override coins? (no — derived, read-only field)
├── How should the frontend integrate mutation?
│   ├── Add transaction form (Type 2 only — modal overlay)
│   ├── Edit transaction (inline in table? overlay? type-aware field disabling)
│   ├── Delete confirmation (toast? modal? inline? Type 1 shows "not allowed")
│   └── Cache invalidation (SWR/Zustand) after mutation
├── How does mutation affect derived data?
│   ├── Balance recalculation (coins_earned - coins_spent)
│   ├── Analytics invalidation/refresh
│   └── Rewards redemption eligibility
├── What are the edge cases and error scenarios?
│   ├── Concurrent edits (optimistic locking?)
│   ├── Invalid timestamp formats
│   ├── Negative amounts (refunds) — coin earning = 0 for both types
│   ├── Status changes affecting coins (PENDING → SUCCESS: Type 1 only, Type 2 always 0)
│   ├── Deleting seeded vs user-created transactions (all seeded are Type 1 → blocked)
│   └── Type confusion: user tries to create Type 1 via POST (reject)
└── What testing strategy?
    ├── Unit tests for validation logic (type-aware)
    ├── E2E tests for create/edit/delete flows (Type 2)
    ├── E2E tests for Type 1 semi-immutable behavior
    └── Isolation tests (user A cannot mutate user B's transactions)
```

## Open questions

1. **ID generation**: Should clients provide transaction IDs (UUID) or should the server generate them? If client provides, how to handle collisions?
2. **Edit scope**: PUT (full replace) vs PATCH (partial update)? Which fields are editable after creation?
3. **Coin recalculation on Type 1 merchant/category edit**: No recalculation needed (amount/status unchanged) — confirm.
4. **Timestamp handling**: Should the frontend send normalized ISO timestamps, or should the backend normalize (reuse `seed.py` logic)?
5. **Analytics refresh**: Invalidate SWR cache on mutation, or add a `refreshAnalytics` endpoint?
6. **Form UX**: Modal overlay (consistent with existing `Overlay` component) vs inline row editing vs separate page?
7. **Validation error display**: Inline field errors vs toast summary vs both?
8. **Type 1 delete**: Confirmed blocked — but should we show "archive/hide" option instead? (Non-goal for v1, but worth noting.)
9. **Optimistic updates**: Update UI immediately then rollback on error, or wait for server response?
10. **Migration for existing seed data**: Add `transaction_type` column with default `type_1_payment` — seed script handles this on re-run.