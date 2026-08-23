# Plutus Seed Script

## Problem Statement

A seed script must load ~10,000 transactions from `transactions.json` into a Supabase PostgreSQL database, normalize the data quality issues present in the source file, and set up the initial application state (default user with computed coin balance, rewards catalogue). This must run as a single documented command and be repeatable for local development and CI.

## Background and Context

- The dataset (`transactions.json`, ~2.3MB, 10,000 records) has already been delivered to `plutus/transactions.json`
- Data quality issues were identified during initial inspection:
  - **Timestamps**: 4 formats present — ISO datetime strings (7,437 records), epoch milliseconds (1,007), date-only strings (715), and slash-separated DD/MM/YYYY HH:MM:SS (841)
  - **Status**: inconsistent casing — `"SUCCESS"` and `"success"` appear in the same column
  - **Duplicate IDs**: 9,960 unique IDs out of 10,000 records (40 duplicates)
  - **Null fields**: some records have JSON `null` for fields like `category`, `merchant`, `currency`, or `payment_method`, which would violate NOT NULL constraints on the typed schema
  - **Amount range**: -₹53,652.71 to ₹999,999,999.00 (negative values may represent refunds)
- The schema (decided in ITD: `postgresql-schema.md`) uses a flat `transactions` table with typed columns
- Coin earning formula: 1 coin per ₹100 spent, capped at 50 coins per transaction, only for `SUCCESS` status
- Supabase is the chosen PostgreSQL provider (user preference, documented in memory)
- The seed script is the first implementation deliverable because the frontend, backend, and analytics all depend on seeded data

## Goals

- Load all 10,000 transactions into a `transactions` table with proper types
- Normalize all timestamps to a single ISO format in the database
- Normalize status values to consistent uppercase (SUCCESS, FAILED, PENDING)
- Handle duplicate transaction IDs (skip or warn, don't crash)
- Compute `coins_earned` for each qualifying transaction (SUCCESS status only)
- Create a default user with the aggregate coin balance
- Insert 4–6 reward items into a `rewards` table
- Run as a single command: `python seed.py` or `psql $DATABASE_URL -f seed.sql`
- Be safe to re-run (idempotent or drop-and-recreate)

## Non-Goals

- Real-time data streaming or incremental updates — this is a batch seed
- User-facing data upload — the seed script runs from the CLI, not from the app UI
- Migration infrastructure (like Alembic) — the schema is simple enough for a single script
- Data validation beyond what's needed to make the seed succeed — we're cleaning known issues, not building a general-purpose ETL pipeline
- Handling schema evolution — the schema is fixed for this assignment

## Constraints

- Must work against Supabase's hosted PostgreSQL (connection via `DATABASE_URL`)
- Must be runnable locally for development (local PostgreSQL or Docker)
- Must use a single documented command
- Python is the preferred language (backend will be FastAPI in Python)
- The seed script must not depend on the Next.js frontend or FastAPI backend being running
- 24-hour total time budget for the entire assignment

## Assumptions

- The default user is the sole user for this demo (no multi-user support in v1)
- Coin balance is computed from existing transaction data at seed time (not a live calculation)
- Duplicate IDs are data errors — we keep the first occurrence and skip duplicates
- Status values are limited to SUCCESS, FAILED, PENDING (no additional statuses exist)
- The rewards catalogue is static and can be hardcoded in the seed script
- Negative amounts represent refunds and earn zero coins

## Problem Tree

```text
How should the seed script handle data quality issues in transactions.json?
├── How to normalize timestamps from 4 formats into one column?
│   ├── Parse epoch milliseconds → ISO datetime
│   ├── Parse date-only strings → timestamp at midnight UTC
│   ├── Parse ISO datetime strings → keep as-is (normalized to UTC)
│   └── Parse slash format (DD/MM/YYYY HH:MM:SS) → ISO datetime
├── How to normalize inconsistent status casing?
│   └── Map "success" → "SUCCESS", leave others unchanged
├── How to handle 40 duplicate transaction IDs?
│   ├── Skip duplicates with a warning log
│   └── OR use INSERT ... ON CONFLICT DO NOTHING (requires PK on id)
└── How to handle JSON null fields that violate NOT NULL constraints?
    └── Coalesce null → default value using `txn.get("field") or "default"`

How should the seed script connect to and manage the Supabase database?
├── What connection method to use (psycopg2, asyncpg, SQLAlchemy)?
├── How to manage environment variables (.env file vs env vars vs CLI args)?
└── How to handle re-runs safely (DROP IF EXISTS vs INSERT OR REPLACE vs TRUNCATE)?

How should coin earnings be computed and the user's balance initialized?
├── Which transactions qualify for coins (SUCCESS status only)?
├── How is the per-transaction cap (50 coins) applied to the amount?
│   └── coins_earned = LEAST(FLOOR(amount / 100), 50) for SUCCESS transactions
└── How is the user's initial balance set (aggregate of all coins_earned)?

What schema objects does the seed script need to create or assume?
├── Does the seed script create tables or assume schema.sql is run first?
├── What tables are needed (transactions, users, rewards)?
└── What indexes are needed for frontend filtering (category, date, amount, status, merchant)?

How should the rewards catalogue be seeded?
├── What 4–6 reward items to include and at what coin cost?
├── How to determine coin costs (relative to average coin balance)?
└── Should rewards be inserted as static data in the script?
```

## Open Questions

- Does the dataset contain any transaction IDs that are `null` or empty strings? (Not confirmed during initial inspection)
- Are negative amounts always refunds, or can they appear for other reasons?
- Should the seed script also populate a `redemptions` table with seed data, or start empty?
- What coin cost should each reward item require — proportional to the average transaction's coin yield?
