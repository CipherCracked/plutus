| ITD 1 — CORRECTED — "Use existing Supabase Auth instead of custom JWT middleware" |
| :---- | :---- |
**MISTAKE DOCUMENTED** | Previous approach (`python-jose` + custom `get_current_user` with hardcoded `SUPABASE_JWT_SECRET`) built middleware (`main.py` line 91) without any token acquisition mechanism. No `/login`, no `supabase` auth client, no JWT generation endpoint. As noted by user: "built a wall without adding a door." The `localStorage` read (`client/src/lib/api.ts` line 12) had no source. | **CORRECTION** |
**Use existing Supabase Auth** (`supabase` Python package / Supabase Auth endpoints) rather than reinventing JWT validation. This provides the actual auth flow: sign-up, sign-in, session tokens, refresh. Remove `python-jose` dependency; replace custom `get_current_user` with Supabase's built-in auth helpers or direct `supabase` client integration. The `user_profiles` table and SQL filtering by `user_profile_id` remain; only the token mechanism changes from invented to existing. | **TRADEOFFS** |
- Adds `supabase` dependency (existing host already uses Supabase PostgreSQL, so this aligns provider with auth).
- Keeps bounded scope: no full RLS rewrite needed; application-level filtering (`WHERE user_profile_id = ?`) stays.
- Eliminates the non-practical custom middleware that had no token source.

**REFERENCES**: `docs/plutus-expansion/itds/auth-middleware.md` (original error); user feedback confirming gap; `main.py` `get_current_user` (line 91) missing token source.
