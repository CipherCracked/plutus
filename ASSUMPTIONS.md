# Assumptions

Product decisions made where the Digital Alpha brief was vague or silent. Each one traces to a problem folder under `docs/`.

## 1. One default user, no authentication

The brief never mentions login. We assume a single implicit user (`plutus_user`, seeded with the database). No auth headers, no session handling; the balance response carries the username as a display field.
*(docs/plutus/intro.md)*

## 2. Seeded history defines the starting balance

The brief says users "earn coins on payments" but not what balance a new user starts with. We assume the seeded transaction history is *this user's own past*, so the seed initializes the coin balance to the total coins that history earned (256,415 at seed time). Redeeming then behaves against a realistic number instead of an arbitrary one.
*(docs/plutus-seed-script/ipds/coin-balance-initialization.md)*

## 3. Only successful payments earn coins

The formula (`1 coin per ₹100, capped per transaction`) is given, but its interaction with payment status isn't. Assumption: only `SUCCESS` transactions earn coins; `PENDING` and `FAILED` earn zero regardless of amount.

## 4. Refunds are real transactions that earn nothing

The dataset contains **148 negative amounts** (refunds/credits). Rather than hiding them we keep them visible in the table and analytics, and explicitly award them 0 coins in the seed script.

## 5. Dirty data is normalized, not dropped — except duplicates

Profiling the provided JSON surfaced data quality issues the brief doesn't mention. Our handling:

| Issue found | Decision |
|---|---|
| Timestamps in **4 formats** (ISO datetime ~7.4k, epoch ms ~1k, date-only ~715, `DD/MM/YYYY HH:MM:SS` ~841) | All normalized to UTC timestamps |
| `category: null` on some rows | Coalesced to `"Uncategorized"` |
| Inconsistent status casing (`success` vs `SUCCESS`) | Uppercased |
| **40 duplicate transaction IDs** | Dropped — first occurrence wins |

*(docs/plutus-seed-script/itds/data-quality-normalization.md)*

## 6. The rewards catalogue is ours to invent

The brief asks for 4–6 rewards "such as vouchers, cashback". We defined 6 items across cashback vouchers, shopping vouchers, a data top-up and an OTT trial perk, priced 100–750 coins (₹50–₹500 of value) so several are reachable within a session's budget.
*(docs/plutus-seed-script/ipds/rewards-catalogue-seeding.md)*

## 7. Redemption atomicity scoped to a single-user demo

The backend runs lookup → balance check → deduct → log inside one database transaction that commits on success and rolls back entirely on failure — no partial states. It deliberately does **not** take a row lock (`SELECT … FOR UPDATE`): correct behaviour for concurrent multi-user redemption was out of scope, and pretending otherwise would be dead code.
*(docs/plutus-backend/itds/atomic-redemption.md)*

## 8. Charts and table share one filtered dataset

For cross-filtering to feel honest, both views must answer the same question. Charts aggregate in memory from exactly the rows the table's filters select — so table filters reshape charts and chart clicks filter the table, with no second API round-trip. The pre-aggregated `/api/analytics` endpoint exists but is intentionally not on this path.
*(docs/plutus-client/chart-to-table-filtering/itds/chart-data-source.md)*

## 9. Dark mode is the product; light mode is a fallback

The visual language ("raw aesthetics": true-black surfaces, gold accent, monospace figures) is designed dark-first. A manual toggle existed early on but controlled nothing — it was removed rather than shipped broken. Light mode survives only as a derived token swap following the OS preference, and gets minimal polish.
*(docs/plutus-client/ipds/distinctive-visual-language.md)*

## 10. "Responsive down to 360px" means usable, not shrunken

At 360px we don't squeeze the desktop layout — the filter bar becomes a bottom sheet with sticky Apply/Clear, the detail view becomes a full-screen overlay, touch targets grow to 44px, and the table scrolls horizontally behind a frozen first column.
*(docs/mobile-responsiveness/intro.md)*

## 11. Idempotent, destructive seeding

Re-running the seed must always work and always produce the same state. We chose drop-and-recreate (`DROP TABLE IF EXISTS … CASCADE`) over upserts — simpler, and acceptable because the database holds only seeded demo data.
*(docs/plutus-seed-script/itds/seed-script-architecture.md)*
