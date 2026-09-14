| ITD 1 — CORRECTED — "Use existing Supabase Auth instead of custom JWT middleware; further simplified to direct UUID" |
| :---- | :---- |
| **MISTAKE DOCUMENTED** | Previous approach (`python-jose` + custom `get_current_user` with hardcoded `SUPABASE_JWT_SECRET`) built middleware (`main.py` line 91) without any token acquisition mechanism. No `/login`, no `supabase` auth client, no JWT generation endpoint. As noted by user: "built a wall without adding a door." The `localStorage` read (`client/src/lib/api.ts` line 12) had no source. | **CORRECTION (v1)** |
| **Use existing Supabase Auth** (`supabase` Python package / Supabase Auth endpoints) rather than reinventing JWT validation. This provides the actual auth flow: sign-up, sign-in, session tokens, refresh. Remove `python-jose` dependency; replace custom `get_current_user` with Supabase's built-in auth helpers or direct `supabase` client integration. The `user_profiles` table and SQL filtering by `user_profile_id` remain; only the token mechanism changes from invented to existing. | **TRADEOFFS (v1)** |
| - Adds `supabase` dependency (existing host already uses Supabase PostgreSQL, so this aligns provider with auth).
| - Keeps bounded scope: no full RLS rewrite needed; application-level filtering (`WHERE user_profile_id = ?`) stays.
| - Eliminates the non-practical custom middleware that had no token source.
| 
| **FURTHER SIMPLIFICATION (v2)** | **CORRECTION (v2)** |
| The `user_profiles` mapping table (`auth_sub` → integer `id`) added unnecessary indirection. Removed entirely. `transactions.user_id` and `redemptions.user_id` now store the Supabase UUID directly. Middleware `get_current_user_id` extracts `sub` from JWT — no DB lookup. Login returns `user_id` (UUID) instead of `user_profile_id` (integer). | **TRADEOFFS (v2)** |
| - Zero mapping tables, zero integer FKs for user identity.
| - Eliminates `auth_sub` mismatch class of bugs (seed stored username string instead of UUID).
| - Fewer joins, simpler schema, simpler queries.
| - `supabase` client used for `auth.get_user(token)`; falls back to local JWT decode for resilience.
| 
| **REFERENCES**: `docs/plutus-expansion/itds/auth-middleware.md` (original error); user feedback confirming gap; `main.py` `get_current_user` (line 91) missing token source; `docs/plutus-expansion/ipds/multi-user-auth.md` (Option 1 direct UUID).