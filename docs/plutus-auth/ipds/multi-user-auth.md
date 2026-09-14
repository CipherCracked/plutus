## Problem to solve

Plutus is isolated: single implicit user (`plutus_user`), no authentication, global balance. To make it a standalone, externally valuable product, users must be able to interact independently with their own transactions and rewards. The assignment brief (`docs/plutus/intro.md`) explicitly excludes multi-user support (`Non-Goals`), but expansion requires it. Using the existing Supabase PostgreSQL host (already configured in `docs/plutus/itds/postgresql-schema.md`), we can add multi-user authentication without changing the database provider or backend framework.

## Options

### Option 1: Supabase Auth JWT middleware in FastAPI (direct UUID)
Add a FastAPI dependency that validates `Authorization: Bearer <JWT>` headers against Supabase Auth. The JWT's `sub` claim (Supabase UUID) is used directly as the user identifier in all tables (`transactions.user_id`, `redemptions.user_id`). No `user_profiles` mapping table. The frontend sends the JWT on every request.

- *How it feels:* A real consumer app. Users sign up/log in; their data is isolated by UUID; the demo user (`plutus_user@plutus.local`) works like any other user.
- *When it makes sense:* When external value means "anyone can sign up and use it independently" — matches standalone + external value direction.

### Option 2: Supabase Auth with `user_profiles` mapping table (intermediate)
Add a `user_profiles` table with integer `id` and `auth_sub` (Supabase UUID). Middleware maps JWT `sub` → `user_profiles.id`. Tables reference `user_profile_id` FK.

- *How it feels:* Works, but adds an unnecessary indirection layer.
- *When it makes sense:* When you need a local integer ID for some legacy reason.

### Option 3: Session-based authentication (cookies/sessions) in FastAPI
Use FastAPI `SessionMiddleware` or `starlette` sessions without JWT. Simpler for a single server, but doesn't scale to separate frontend deployments (Vercel) or mobile clients easily.

- *How it feels:* Works for local demo; breaks easily when deployed (cookie domain mismatch between Vercel frontend and Render backend).
- *When it makes sense:* For local-only demos — not for deployed, shareable value.

### Option 4: No authentication, but multi-user data model (simulated)
Keep single-user demo; add `created_by` fields to transactions/rewards but no login. Users see data tagged by a simulated user ID.

- *How it feels:* Fake multi-user — no isolation, no real value.
- *When it makes sense:* When the goal is documentation theater rather than real utility.

## Reasoning

The user selected Option 1 direction from `docs/plutus-expansion/intro.md`: standalone + external value, not cross-project links (`hackerrank-orchestrate`, `superstore-erp`). Option 1 (Supabase Auth JWT with direct UUID) satisfies this with minimal technical change: Supabase is already the database host (`docs/plutus/itds/postgresql-schema.md`), so adding `supabase-auth` middleware uses the same connection pool. The frontend (`client/src/lib/api.ts`) only needs an `Authorization` header added to `fetch`. The schema (`server/schema.sql`) uses `user_id TEXT` directly — no mapping table, no rebuild.

Option 2 (`user_profiles` mapping) was an intermediate implementation that added an unnecessary indirection layer (integer ID → UUID mapping). It was replaced by the direct UUID approach.

Option 3 (session cookies) fails the deployment constraint (`docs/plutus-expansion/intro.md` #3): Vercel frontend and Render backend are separate origins; cookie-based auth introduces CORS and domain issues that JWT avoids. Option 4 (simulated) contradicts the user's explicit direction — real utility, not decoration.

The design preserves the existing single-user demo (`docs/plutus/intro.md` assumptions #1, #2) by keeping `plutus_user@plutus.local` as the default/demo user — it works like any other user, no special anonymous access needed.

## Tradeoffs

- No `user_profiles` table, no `auth_sub` column, no integer FKs — simpler schema, fewer joins.
- Supabase Auth UUID used directly — no mapping layer, no mismatch bugs (the original `auth_sub` bug where seed stored username string instead of UUID).
- Application-level filtering (`WHERE user_id = ?`) used instead of Supabase RLS — correct for this bounded scope, requires discipline but is explicit and testable.
- `supabase` Python package for auth (already a dependency for Supabase PostgreSQL host).

## Notes

- This IPD couples with ITDs in `docs/plutus-expansion/itds/` for auth middleware, schema, and seed script updates.
- The `docs/plutus-expansion/intro.md` problem tree (`How can Plutus become less isolated?`) originates this decision. Deeper sub-folders (`docs/plutus-expansion/auth/`, etc.) may be needed for implementation-level decomposition.
- References: `docs/plutus-expansion/intro.md`, `docs/plutus/itds/postgresql-schema.md`, `docs/plutus-seed-script/intro.md`, `DECISIONS.md` DT 7.
