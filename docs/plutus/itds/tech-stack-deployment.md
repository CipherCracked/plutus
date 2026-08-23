| ITD 1 - "Use Next.js frontend + FastAPI backend + PostgreSQL deployed via Vercel + Render + Supabase." |  |
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
| **Option 9** | **Supabase** — generous free tier, familiar to the team, Postgres already configured with connection pooling. |
| **Option 10** | Neon — serverless PostgreSQL, free tier sufficient for demo, integrates with Render. |
| **Option 11** | Railway Postgres — bundled with backend hosting. | **REASONING** |
| **Frontend** | Next.js is explicitly "preferred" by the assignment. The App Router (Next.js 13+) gives Server Components for data fetching, keeping the 10k-row table data out of the client bundle. File-based API routes also provide a fallback if hosting the backend separately proves difficult. |
| **Backend** | FastAPI is the stronger choice: Pydantic models give automatic request validation (critical for the redeem endpoint), async support handles concurrent table queries, and auto-generated OpenAPI docs make the API self-documenting. Flask would work but lacks these conveniences. |
| **Hosting** | The most pragmatic 24-hour path: **Vercel (frontend) + Render (backend) + Supabase (PostgreSQL)**. All three offer free tiers sufficient for a demo, with straightforward git-push or dashboard deployment. Supabase's Postgres is already configured with connection pooling, removing a common deployment gotcha. If any step fails, the fallback is local dev (Next dev server + FastAPI on localhost + local Postgres) + demo video. |
| **Database** | Supabase's free tier includes Postgres with connection pooling and a generous 500MB allocation — more than sufficient for a 10k-row demo dataset. The team is already familiar with the Supabase dashboard, reducing setup time. | **TRADEOFFS** |
| | Hosting everything on free tiers means potential cold starts (Vercel Hobby, Render free) and rate limits. For a 24-hour assignment demo, this is acceptable. Supabase's Postgres already includes connection pooling, avoiding a common serverless Postgres gotcha. If deployment proves too flaky, the local-dev + video fallback is explicitly accepted by the assignment. | **NOTES** |
| | Seed script: Python script (`seed.py`) using `psycopg2` or `asyncpg` that reads `transactions.json`, creates the schema, and inserts all rows. One command: `python seed.py` or `psql $DATABASE_URL -f schema.sql && python seed.py`. Frontend fetches from FastAPI backend (not directly from Postgres) to match the assignment's "real API" requirement. |
