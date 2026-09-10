# Auth Door — Problem Decomposition

## Problem Statement
The multi-user auth middleware (`main.py` `get_current_user`) validates Supabase JWT tokens but provides no mechanism for users to obtain one. There is no `/api/login` endpoint, no frontend login form, and no token storage flow. The feature is a "wall without a door" — isolated, not usable.

## Background and Context
- `docs/plutus-expansion/itds/auth-middleware.md` corrected: uses `supabase` client (`supabase_client.auth.get_user`) instead of custom `python-jose` middleware.
- `client/src/lib/api.ts` reads `plutus_auth_token` from `localStorage`/`sessionStorage` but nothing writes it.
- Protected all user-specific endpoints: `/api/transactions`, `/api/balance`, `/api/redeem` (all require `Depends(get_current_user)`).
- Homepage (`/`) redirects to `/login` when `plutus_auth_token` absent (`page.tsx`).
- Auth middleware corrected: uses `supabase` (`python-jose` removed); no useless `plutus_user` fallback.
- `docs/plutus-expansion/itds/auth-middleware-correction.md` records design mistake and fix.
- User approved: "both — endpoint and UI".

## Goals
- Provide a practical login mechanism that produces a valid JWT via Supabase Auth.
- Add a minimal frontend login UI that acquires and stores the token.
- Preserve the demo user (`plutus_user`) as anonymous fallback (optional, but user removed useless fallback — so login is required for multi-user isolation).

## Non-Goals
- Password reset, email verification (post-registration), or production-grade security hardening beyond basic JWT.
- Changing existing `user_profiles` isolation or endpoint filtering design.

## Registration — Required Companion to Login
Without registration, login is useless: no user can create an account. The bounded scope must include a minimal `/api/register` endpoint (Supabase `sign_up`) and a matching UI. This was omitted initially — corrected here.

## Constraints
- Must use existing `supabase` dependency (`requirements.txt`).
- Must integrate with existing FastAPI backend (`main.py`).
- Must work with existing frontend (`client/src/lib/api.ts`, Zustand, SWR).
- Must not break `docs/overlay-accessibility/` focus-trap contract.

## Assumptions
- `SUPABASE_URL` and `SUPABASE_KEY` are configured in environment.
- Users interact via browser (`localStorage` available).
- Bounded scope: login endpoint + minimal UI only.

## Problem Tree (4 root questions)

1. **What user experience should login provide?** — quick token acquisition, minimal form, clear error states, no complex navigation.
2. **How should the endpoint be designed?** — `POST /api/login` using `supabase.auth.sign_in_with_password` or `sign_in` method; return token to frontend; handle invalid credentials gracefully.
3. **How should the frontend interact with auth?** — form submits to endpoint, stores token in `localStorage`, injects into `authHeaders()`, redirects to dashboard on success.
4. **How should token storage and security work?** — `localStorage` for demo scope (per `docs/plutus-expansion/intro.md` non-goals: no production-grade hardening); token cleared on explicit logout; no cookie/session restructuring.

## Open Questions
- Should the endpoint return the full user profile (`user_profiles.id`) or just the token?
- Should the UI be a modal overlay (reusing `docs/overlay-accessibility/` patterns) or a separate page?
- Should we keep anonymous access or require login for all endpoints (user removed useless fallback — implies required)?
