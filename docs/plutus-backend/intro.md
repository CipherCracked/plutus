# Plutus — Backend API Server

## Problem Statement

The Plutus frontend needs a RESTful API server to serve transaction data,
coin balances, rewards catalogues, and handle reward redemptions. The backend
must use Python (FastAPI preferred), connect to PostgreSQL, and expose at least
4 endpoints that the frontend consumes. The key questions are about the
data-serving strategy (server-side filtering vs full-load), the atomicity
guarantees needed for redemption, and how to structure the API for the
frontend's specific access patterns (10k rows for virtualization, instant
search, chart aggregation).

## Background and Context

- The assignment requires a Python backend with FastAPI or Flask, proper
  separation of routes / business logic / data access.
- PostgreSQL is mandatory — no SQLite or MongoDB.
- The frontend loads transactions once and caches them (per the
  `client-state-management` ITD). The API should return all 10k rows in a
  single call.
- The frontend computes charts from in-memory data (per the
  `chart-data-source` ITD). So `/api/analytics` is a reference endpoint,
  not the primary data path for charts.
- The seed script (`server/seed.py`) populates the database with 10k
  transactions + rewards catalogue + default user balance.
- Redemption must be atomic: check balance → deduct → log, all in one
  transaction, to prevent race conditions on concurrent requests.

## Goals

- Expose 5 REST endpoints: transactions (full list), balance, rewards
  (catalogue), redeem (POST), analytics (aggregates)
- Return data as JSON with TypeScript-compatible shapes (matching the
  frontend's `api.ts` interfaces)
- Handle error cases with proper HTTP status codes
- Use a context manager for database connections (no leaks)
- Provide clear `requirements.txt` for dependency installation
- Support local development (`uvicorn main:app --reload`)

## Non-Goals

- Authentication, authorization, or multi-user support — single demo user
- Request rate limiting, API keys, or production-grade security hardening
- Server-side pagination, filtering, or sorting (the frontend does this
  client-side on its cached 10k rows)
- Async database drivers or connection pooling (psycopg2 is sufficient for
  a demo; async could be a future optimization)
- Deployment infrastructure (Heroku, Render, etc.) — local dev only

## Constraints

- **Language:** Python 3.10+
- **Framework:** FastAPI (preferred) or Flask
- **Database:** PostgreSQL via Supabase, using `psycopg2` driver
- **Environment:** `DATABASE_URL` in `.env` file at project root
- **Schema:** Must use the relational schema defined in `server/schema.sql`
  (transactions, users, rewards, redemptions tables)
- **API contract:** Response shapes must match the Pydantic models, which
  in turn match the TypeScript interfaces in `client/src/lib/api.ts`

## Assumptions

- The frontend fetches all transactions in one call (10k rows ≈ 5–8MB JSON)
- The default user (`plutus_user`) is created by the seed script
- Redemption operates only on the default user's balance
- `transactions.json` is already loaded into the database by `seed.py`
  before the API is used
- The `/api/analytics` endpoint is provided for completeness but the
  frontend primarily computes charts client-side

## Problem Tree

```text
How should the backend API be structured to serve the frontend's needs?
├── How many endpoints are needed and what are their exact shapes?
├── Should the API support server-side filtering/sorting, or return full data?
├── How should the connection lifecycle be managed (pool, context manager)?
├── How should errors be surfaced — HTTP status codes vs. JSON error bodies?
└── How should the API be tested locally without a frontend?

How should reward redemption be guaranteed atomic?
├── What constitutes the redemption "transaction" (verify → check → deduct → log)?
├── How should insufficient balance be communicated to the frontend?
├── What happens on concurrent redemption requests (race condition)?
└── How should the redemption log preserve auditability?

How should the Pydantic models match the frontend types?
├── How should timestamps be serialized (ISO 8601, timezone-aware vs naive)?
├── Should optional fields use Optional[T] or default values?
├── How should the analytics response nest category and monthly data?
└── Should enums be used for status (SUCCESS/FAILED/PENDING)?

What dependencies and development workflow does the backend need?
├── How should requirements.txt be structured (exact pins vs ranges)?
├── What dev tool is preferred (uvicorn vs flask run)?
├── How should .env loading work (dotenv, path resolution)?
└── How should CORS be configured for localhost:3000?
```

## Open Questions

- Should the `/api/analytics` endpoint be removed if the frontend never
  uses it? (It's documented as a reference but not consumed in the
  cross-filtering design.)
- Should `/api/transactions` support optional query parameters for
  server-side filtering as a future optimization? (Currently returns all
  rows; adding filters would be backward-compatible.)
- Is there a need for request/response logging or observability beyond
  what FastAPI provides by default?
- Should the seed script's `requirements.txt` and the API server's
  `requirements.txt` be the same file or separate? (Currently the API
  server adds fastapi/uvicorn/pydantic to the seed's psycopg2/dotenv.)
