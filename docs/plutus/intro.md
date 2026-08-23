# Plutus — Credit Card Bill Payment & Rewards App

## Problem Statement

Build a consumer-facing credit-card bill payment and rewards application. The app allows users to pay credit-card bills, earn reward coins on payments, and view their own spending through a transactions dashboard and spend analytics. The solution must be built end-to-end — frontend through database — within a 24-hour take-home assignment window, prioritizing depth over breadth.

## Background and Context

- The assignment is a take-home for a Full Stack Engineer role (frontend-focused) at Digital Alpha Technologies
- A dataset of ~10,000 transactions is provided as `transactions.json` (not yet received at time of writing)
- The app targets individual consumers who pay credit-card bills and want to track spending and earn rewards
- Evaluation weight order: frontend engineering → CSS/UI craft → 10k-row dataset handling → assumption judgment → backend/DB fundamentals → process
- 24-hour time limit; polish on a smaller feature set is preferred over half-built breadth
- The look and feel, project name ("Plutus"), and any brief-specified details are left to the builder to decide and document

## Goals

- Display 10,000 transactions in a smooth, responsive table with filtering, search, and sorting
- Provide spend analytics through at least one chart (category breakdown or monthly trend), with chart-to-table filtering
- Implement a rewards system: earn coins (1 coin per ₹100 spent, capped per transaction), display balance, and enable redemption from a curated catalogue (4–6 rewards)
- Build a backend API (4 minimum endpoints) with proper validation and error handling
- Use PostgreSQL with a proper relational schema (not a JSON dump) and a one-command seed
- Deploy the app to the web (or record a demo video if deployment isn't possible)
- Produce clear documentation: README, ASSUMPTIONS.md, DECISIONS.md, AI-USAGE.md

## Non-Goals

- A full, polished fintech product — this is a take-home assignment with a tight deadline
- Real payment processing integration — the app simulates payments using the provided dataset
- Multi-user support or authentication — a single-user demo is sufficient
- Comprehensive test suites — tests are a bonus, not a requirement
- Mobile app — the app is a web application (Next.js preferred)
- Deployment is optional if a demo video is provided in time

## Constraints

- **Time box**: 24 hours from receipt of the assignment
- **Frontend**: React with TypeScript, Next.js preferred; hand-build the Table component with no component libraries (no MUI, Ant, Chakra, shadcn); responsive down to 360px
- **Backend**: Python with FastAPI or Flask; separate routes, business logic, and data access
- **Database**: PostgreSQL mandatory (v18 preferred, v16+ acceptable); SQLite and MongoDB not accepted
- **Schema**: Must be a proper relational schema, not a JSON dump into a single column
- **Seed**: One documented command to set up schema + load data
- **Evaluation**: Depth on core beats breadth — get core features solid before nice-to-haves

## Assumptions

- Transactions in the dataset represent historical credit-card bill payment records (date, amount, category, merchant, payment status)
- There is a single default user whose coin balance is tracked locally
- Coin earning applies to transactions where payment status is "successful" or "paid"
- Rewards catalogue is static and predefined (vouchers, cashback, etc.)
- The app is a demo/assignment artifact — no production-grade security or compliance required

## Problem Tree

```text
What experience should users have for viewing and interacting with transactions?
├── How should the 10k-row table handle rendering — virtualization vs pagination?
├── What filter dimensions are needed (category, date, amount, payment status, merchant search)?
├── What sort options are required (date, amount) and how should multi-sort behave?
└── How should row detail be surfaced — modal, drawer, or inline expansion?

How should spending insights be presented and visualized?
├── What chart types best represent category breakdown and monthly trend?
├── Should charts support cross-filtering from table and vice versa?
└── How should chart interactions update the transaction table in real time?

What reward mechanics should govern coin earning and redemption?
├── How is the per-transaction coin cap defined and enforced?
├── What balance state must be preserved across redemptions?
└── How should redemption failures (insufficient balance, invalid reward) be handled cleanly?

How should the data layer be designed to serve 10k+ transactions efficiently?
├── What normalized schema maps the JSON dataset to relational tables?
├── Should filtering, sorting, and pagination happen server-side or client-side?
└── What indexes are needed for fast text search and multi-column filtering?

What defines a complete, deployable solution within the 24-hour time constraint?
├── Which requirements are "core" (must ship) vs "nice-to-have" vs "bonus"?
├── What documentation artifacts must accompany the code?
└── What is the minimum viable deployment or demo video for submission?
```

## Open Questions

- Does the provided `transactions.json` include payment status, or must it be inferred from the data?
- Should coin balance persist in the database (per-user) or can it be computed from transaction history?
- Is there an expected format/structure for the `transactions.json` dataset that should inform schema design?
- Are there specific reward catalogue items the reviewers expect, or can these be entirely builder-defined?
