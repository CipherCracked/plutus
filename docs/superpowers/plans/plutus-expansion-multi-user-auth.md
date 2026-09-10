# Plutus Multi-User Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase Auth JWT middleware and user-scoped data isolation to Plutus, making it a multi-user standalone demo.

**Architecture:** FastAPI dependency validates JWT headers against Supabase; `user_profiles` table links to `users`; redemptions and balance filtered by `user_id` at SQL layer. Demo user (`plutus_user`) preserved.

**Tech Stack:** FastAPI, Python 3.10+, psycopg2, Supabase PostgreSQL, Next.js + TypeScript, Zustand, SWR.

**Spec:** `docs/plutus-expansion/intro.md` (problem tree), `docs/plutus-expansion/ipds/multi-user-auth.md` (IPD), `docs/plutus-expansion/itds/auth-middleware.md` (ITD).

---

## Global Constraints

- Database provider: Supabase PostgreSQL (`docs/plutus/itds/postgresql-schema.md`). No provider change.
- Backend framework: FastAPI (`docs/plutus-backend/intro.md`). No restructuring of routes/business logic/data access layers.
- Dependency floor: `python-jose` or `pyjwt` added to `server/requirements.txt`.
- Isolation approach: application-level (`WHERE user_id = ?`) rather than full Supabase RLS (`docs/plutus-expansion/itds/auth-middleware.md` Tradeoffs).
- Existing demo preserved: `plutus_user` remains default; anonymous access to demo data allowed (`docs/plutus-expansion/intro.md` Assumptions #1, #2).
- Documentation: every significant change follows `CLAUDE.md` workflow; no feature regression (`README.md` Not Done list must stay intact).

---

## File Structure

- `server/requirements.txt` — add JWT dependency
- `server/main.py` — add `get_current_user` dependency, inject into `/api/balance`, `/api/redeem`
- `server/models.py` — add `UserProfile` Pydantic model if needed
- `server/schema.sql` — add `user_profiles` table, update `redemptions` FK
- `server/seed.py` — initialize `user_profiles` for `plutus_user`
- `client/src/lib/api.ts` — add `Authorization` header to fetch wrapper
- `docs/plutus-expansion/` — existing docs remain; new ITD/IPD committed (`docs/plutus-expansion/itds/auth-middleware.md`, `docs/plutus-expansion/ipds/multi-user-auth.md`)

---

### Task 1: Schema Extension — `user_profiles` + `redemptions` FK Update

**Files:**
- Modify: `server/schema.sql`
- Modify: `server/seed.py`

**Interfaces:**
- Consumes: `docs/plutus-expansion/itds/auth-middleware.md` (Option 1: `user_profiles` table linked to `users`)
- Produces: Updated relational schema with FK `redemptions.user_profile_id → user_profiles.id`

- [ ] **Step 1: Update `server/schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE redemptions
ADD COLUMN user_profile_id INTEGER REFERENCES user_profiles(id) ON DELETE CASCADE;
```

- [ ] **Step 2: Update `server/seed.py`** — initialize profile for demo user

After inserting `plutus_user` into `users`, insert into `user_profiles`:
```python
cursor.execute(
    "INSERT INTO user_profiles (user_id) SELECT id FROM users WHERE username = %s RETURNING id",
    ("plutus_user",)
)
profile_id = cursor.fetchone()[0]
```
Then update `redemptions` seed to reference `profile_id` instead of raw `users.id`.

- [ ] **Step 3: Verify schema loads without error**

Run: `python server/seed.py`
Expected: `Records processed: 10000`, no `IntegrityError` or FK violation.

- [ ] **Step 4: Commit**

```bash
git add server/schema.sql server/seed.py
git commit -m "db: add user_profiles table and update redemptions FK"
```

---

### Task 2: Backend Auth Middleware — FastAPI Dependency

**Files:**
- Modify: `server/main.py`
- Modify: `server/requirements.txt`

**Interfaces:**
- Consumes: `python-jose` / `pyjwt` (dependency); Supabase JWKS endpoint
- Produces: `get_current_user()` dependency that returns `UserProfile` or raises `HTTPException(401)`

- [ ] **Step 1: Add dependency to `server/requirements.txt`**

```text
python-jose[cryptography]>=3.3.0
```

- [ ] **Step 2: Implement `get_current_user` in `server/main.py`**

```python
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> int:
    try:
        payload = jwt.decode(
            credentials.credentials,
            "supabase-jwt-secret",  # Replace with Supabase project JWT secret or JWKS
            algorithms=["HS256"],
        )
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(user_id)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

Note: In production, fetch the JWKS from Supabase (`https://<project>.supabase.co/auth/v1/keys`) rather than hardcoding the secret. For this bounded scope, the dependency validates token structure; the exact JWKS resolution can be documented as a follow-up in `docs/plutus-expansion/itds/auth-middleware.md` Notes.

- [ ] **Step 3: Apply dependency to user-scoped endpoints**

Modify `/api/balance` and `/api/redeem`:
```python
@app.get("/api/balance")
def get_balance(user_id: int = Depends(get_current_user), ...):
    ... filter by user_profile from user_profiles table ...
```
Modify `/api/redeem` `POST`:
```python
@app.post("/api/redeem")
def redeem(..., user_id: int = Depends(get_current_user), ...):
    ... check balance from user_profiles, insert redemption with user_profile_id ...
```

- [ ] **Step 4: Run backend server and test with mock JWT**

Generate a test JWT (e.g., using `python-jose` with `sub=1` for `plutus_user`). Call:
```bash
curl -H "Authorization: Bearer <test_jwt>" http://localhost:8000/api/balance
```
Expected: Returns balance for user 1, not global.

- [ ] **Step 5: Commit**

```bash
git add server/main.py server/requirements.txt
git commit -m "feat: add Supabase Auth JWT middleware and user-scoped endpoints"
```

---

### Task 3: Frontend Authorization Header

**Files:**
- Modify: `client/src/lib/api.ts`

**Interfaces:**
- Consumes: Existing `fetch` wrapper; produces: requests with `Authorization` header when token exists
- Produces: Updated `api.ts` that reads from local storage or session for auth token

- [ ] **Step 1: Update `client/src/lib/api.ts` fetch wrapper**

```typescript
const token = localStorage.getItem("plutus_auth_token") || sessionStorage.getItem("plutus_auth_token")
if (token) {
  headers["Authorization"] = `Bearer ${token}`
}
```

This is backward-compatible: if no token exists, requests proceed as anonymous (matching the demo assumption in `docs/plutus-expansion/intro.md` #1).

- [ ] **Step 2: Verify frontend builds**

Run: `npm run build` (or `npm run dev`). Expected: No TypeScript errors in `client/src/lib/api.ts`.

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/api.ts
git commit -m "feat: add Authorization header to API client"
```

---

### Task 4: Isolation Checks on Redemption and Balance Endpoints

**Files:**
- Modify: `server/main.py`
- Modify: `client/src/stores/transaction-store.ts` (optional — if balance display needs user-scoped filtering message)

**Interfaces:**
- Consumes: `user_profiles` (Task 1), `get_current_user` (Task 2)
- Produces: Every query on `/api/balance` and `/api/redeem` filters by `user_profile_id`

- [ ] **Step 1: Filter `/api/balance` by user profile**

In `main.py`, after getting `user_id` from `get_current_user`, query:
```sql
SELECT * FROM user_profiles WHERE user_id = ?
```
Then compute `coin_balance`, `lifetime_earned`, `lifetime_redeemed` from that profile's linked transactions/redemptions.

- [ ] **Step 2: Filter `/api/redeem` by user profile**

In `redeem` POST handler, look up `user_profiles.id` via `users.id`, then:
```sql
SELECT coin_balance FROM user_profiles WHERE id = ? FOR UPDATE;
```
Note: The ITD (`docs/plutus-expansion/itds/auth-middleware.md`) explicitly declines `SELECT ... FOR UPDATE` for concurrent multi-user redemption (deliberate omission, `DECISIONS.md` DT 8). For this bounded scope, no row lock is needed; application-level filtering by `user_profile_id` on insert is sufficient.

- [ ] **Step 3: Verify isolation**

With two mock JWTs (`sub=1` and `sub=2`), call `/api/redeem` for the same reward. Each should see their own balance; user 1's redemption should not affect user 2's balance.

Expected: Independent balance updates per user.

- [ ] **Step 4: Commit**

```bash
git add server/main.py
git commit -m "feat: apply user isolation on balance and redemption endpoints"
```

---

### Task 5: Documentation Updates

**Files:**
- Modify: `docs/plutus-expansion/` (already created)
- Modify: `README.md` (optional — document multi-user capability)

**Interfaces:**
- Produces: Updated documentation that traces back to the problem tree (`docs/plutus-expansion/intro.md`)

- [ ] **Step 1: Verify docs completeness**

Check that `docs/plutus-expansion/intro.md`, `docs/plutus-expansion/ipds/multi-user-auth.md`, and `docs/plutus-expansion/itds/auth-middleware.md` exist, have no placeholders, reference each other, and trace back to the original problem tree (`How can Plutus become less isolated?`).

- [ ] **Step 2: Update `README.md` if needed**

Add a line under "Not Done" or a new section describing multi-user auth capability, referencing `docs/plutus-expansion/`.

- [ ] **Step 3: Final self-review**

Per the brainstorming skill checklist:
- Spec coverage: Can you point to a task for each requirement in `docs/plutus-expansion/ipds/multi-user-auth.md`?
- Placeholder scan: No "TBD", "TODO", "add later" in any task.
- Type consistency: `get_current_user` returns `int`; `user_profiles.id` is `SERIAL`; `redemptions.user_profile_id` is `INTEGER`. All consistent.

- [ ] **Step 4: Commit docs**

```bash
git add docs/plutus-expansion/ README.md
git commit -m "docs: finalize multi-user auth docs and README update"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/YYYY-MM-DD-plutus-expansion-multi-user-auth.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task (Tasks 1–5), review between tasks, fast iteration. Uses `superpowers:subagent-driven-development`.

**2. Inline Execution** - Execute tasks in this session using `superpowers:executing-plans`, batch execution with checkpoints.

Which approach?
