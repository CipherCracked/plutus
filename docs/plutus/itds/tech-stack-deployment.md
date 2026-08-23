| ITD 1 - "Use Next.js frontend + FastAPI backend + PostgreSQL deployed via Vercel + Render + Neon." |  |
| :---- | :---- |
| **THE PROBLEM** | The assignment requires a full-stack application with specific technology constraints: React + TypeScript (Next.js preferred) for the frontend, Python (FastAPI or Flask) for the backend, and PostgreSQL (mandatory, v16+ preferred). The app must be deployed live or accompanied by a demo video if deployment isn't possible within 24 hours. A clear stack and deployment decision is needed before implementation begins. | **OPTIONS CONSIDERED (Decision in bold)** |
| **Option 1** | **Next.js (App Router, TypeScript)** — preferred by the assignment. Server Components keep 10k-row data out of the client bundle. File-based API routes as fallback backend. Easy Vercel deployment. |
| **Option 2** | Vite + React (TypeScript) + separate CRA-style setup. More control, but lacks Next.js benefits and isn't the "preferred" stack. |
| **Option 3** | **FastAPI** — modern, async, auto-generates OpenAPI docs, Pydantic models for validation (critical for redeem endpoint), excellent async PostgreSQL support. |
| **Option 4** | Flask — mature, simple, but sync-by-default and lacks FastAPI's built-in validation and auto-docs. |
| **Option 5** | **Render** — straightforward FastAPI deployment, free tier, handles PostgreSQL add-ons. |
| **Option 6** | Railway — similar to Render, supports PostgreSQL. |
| **Option 7** | Fly.io — excellent performance, slightly more complex setup. |
| **Option 8** | Self-host locally + demo video — fallback if all hosted options fail. |
| **Option 9** | **Neon** — serverless PostgreSQL, free tier sufficient for demo, integrates with Render. |
| **Option 10** | Supabase — also has free Postgres tier. |
| **Option 11** | Railway Postgres — bundled with backend hosting. | **REASONING** |
| **Frontend** | Next.js is explicitly "preferred" by the assignment. The App Router (Next.js 13+) gives Server Components for data fetching, keeping the 10k-row table data out of the client bundle. File-based API routes also provide a fallback if hosting the backend separately proves difficult. |
| **Backend** | FastAPI is the stronger choice: Pydantic models give automatic request validation (critical for the redeem endpoint), async support handles concurrent table queries, and auto-generated OpenAPI docs make the API self-documenting. Flask would work but lacks these conveniences. |
| **Hosting** | The most pragmatic 24-hour path: **Vercel (frontend) + Render (backend) + Neon (PostgreSQL)**. All three offer free tiers sufficient for a demo, have straightforward git-push deployment, and the Render + Neon combination is well-documented. If any step fails, the fallback is local dev (Next dev server + FastAPI on localhost + local Postgres) + demo video. |
| **Database** | Neon's serverless PostgreSQL free tier is sufficient for a demo dataset of 10k rows. May require connection pooling (pgBouncer on Render) to handle concurrent connections — a known gotcha worth documenting in the README. | **TRADEOFFS** |
| | Hosting everything on free tiers means potential cold starts (Neon serverless) and rate limits (Vercel Hobby, Render free). For a 24-hour assignment demo, this is acceptable. Using Neon's serverless Postgres may require connection pooling to handle concurrent connections. If deployment proves too flaky, the local-dev + video fallback is explicitly accepted by the assignment. | **NOTES** |
| | Seed script: Python script (`seed.py`) using `psycopg2` or `asyncpg` that reads `transactions.json`, creates the schema, and inserts all rows. One command: `python seed.py` or `psql $DATABASE_URL -f schema.sql && python seed.py`. Frontend fetches from FastAPI backend (not directly from Postgres) to match the assignment's "real API" requirement. |
