## Problem to solve

Plutus is isolated: single implicit user (`plutus_user`), no authentication, global balance. To make it a standalone, externally valuable product, users must be able to interact independently with their own transactions and rewards. The assignment brief (`docs/plutus/intro.md`) explicitly excludes multi-user support (`Non-Goals`), but expansion requires it. Using the existing Supabase PostgreSQL host (already configured in `docs/plutus/itds/postgresql-schema.md`), we can add multi-user authentication without changing the database provider or backend framework.

## Options

### Option 1: Supabase Auth JWT middleware in FastAPI
Add a FastAPI dependency that validates `Authorization: Bearer <JWT>` headers against Supabase Auth. Create a `user_profiles` table linked to the `users` table (`plutus_user` remains the default demo user). Each user's balance and redemptions are scoped to their `user_id`. The frontend sends the JWT on every request.

- *How it feels:* A real consumer app. Users sign up/log in; their data is isolated; the demo user (`plutus_user`) remains available as a public/shared demo without auth.
- *When it makes sense:* When external value means "anyone can sign up and use it independently" — matches standalone + external value direction.

### Option 2: Session-based authentication (cookies/sessions) in FastAPI
Use FastAPI `SessionMiddleware` or `starlette` sessions without JWT. Simpler for a single server, but doesn't scale to separate frontend deployments (Vercel) or mobile clients easily.

- *How it feels:* Works for local demo; breaks easily when deployed (cookie domain mismatch between Vercel frontend and Render backend).
- *When it makes sense:* For local-only demos — not for deployed, shareable value.

### Option 3: No authentication, but multi-user data model (simulated)
Keep single-user demo; add `created_by` fields to transactions/rewards but no login. Users see data tagged by a simulated user ID.

- *How it feels:* Fake multi-user — no isolation, no real value.
- *When it makes sense:* When the goal is documentation theater rather than real utility.

## Reasoning

The user selected Option 2 direction from `docs/plutus-expansion/intro.md`: standalone + external value, not cross-project links (`hackerrank-orchestrate`, `superstore-erp`). Option 1 (Supabase Auth JWT) satisfies this with minimal technical change: Supabase is already the database host (`docs/plutus/itds/postgresql-schema.md`), so adding `supabase-auth` middleware uses the same connection pool. The frontend (`client/src/lib/api.ts`) only needs an `Authorization` header added to `fetch`. The existing schema (`server/schema.sql`) requires only a `user_profiles` extension, not a rebuild.

Option 2 (session cookies) fails the deployment constraint (`docs/plutus-expansion/intro.md` #3): Vercel frontend and Render backend are separate origins; cookie-based auth introduces CORS and domain issues that JWT avoids. Option 3 (simulated) contradicts the user's explicit direction — real utility, not decoration.

The design preserves the existing single-user demo (`docs/plutus/intro.md` assumptions #1, #2) by keeping `plutus_user` as the default/demo user and allowing anonymous access to the demo data, while new users get isolated profiles.

## Tradeoffs

- Adding JWT validation introduces a dependency (`python-jose` or `pyjwt`) to the backend (`server/requirements.txt`).
- The `redemptions` table (`docs/plutus/itds/postgresql-schema.md`) must add a foreign key to `user_profiles` instead of `users`. The seed script (`docs/plutus-seed-script/intro.md`) must initialize both the demo user profile and any new user profiles.
- Multi-user isolation requires applying RLS policies (Supabase) or application-level checks (`user_id` filtering). The simpler approach is application-level checks (filter by `user_id` in SQL) rather than full RLS, to avoid database-level complexity in this bounded scope.
- The `DECISIONS.md` record (DT 7) notes no FK relationships on category strings; adding `user_profiles` introduces a real FK (`redemptions.user_profile_id` → `user_profiles.id`), which is acceptable and improves data integrity.

## Notes

- This IPD couples with ITDs in `docs/plutus-expansion/itds/` for auth middleware, schema extension, and seed script updates.
- The `docs/plutus-expansion/intro.md` problem tree (`How can Plutus become less isolated?`) originates this decision. Deeper sub-folders (`docs/plutus-expansion/auth/`, etc.) may be needed for implementation-level decomposition.
- References: `docs/plutus-expansion/intro.md`, `docs/plutus/itds/postgresql-schema.md`, `docs/plutus-seed-script/intro.md`, `DECISIONS.md` DT 7.
