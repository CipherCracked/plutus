# Plutus Expansion — Problem Decomposition

## Problem statement

Plutus remains isolated: a single-user demo with a static dataset (`transactions.json`) and no connections to other work or real-world utility. The user wants it to become less isolated by applying the `fintech-ui-2026` design skill (saved during the original project) and making it a standalone, externally valuable web product. The direction is not to link Plutus to `hackerrank-orchestrate` (LangGraph pipeline) or `superstore-erp` (React Native billing), but to grow Plutus into a shareable, multi-user-capable demo with real utility — using Supabase (already configured) for multi-user support and exposing a public API for external integration.

## Background and context

- Plutus was built as a 24-hour assignment (`docs/plutus/intro.md`) with a single default user (`plutus_user`), no authentication, and a static rewards catalogue (`docs/plutus-seed-script/ipds/rewards-catalogue-seeding.md`).
- The visual language (`docs/plutus-client/ipds/distinctive-visual-language.md`) references 2026 fintech UI trends saved as `.claude/skills/fintech-ui-2026/skill.md`. This skill can inform new pages or redesigns.
- The database (`docs/plutus/itds/postgresql-schema.md`) uses Supabase PostgreSQL with connection pooling. Supabase supports authentication, row-level security, and multi-user schemas — no technology change needed.
- The backend (`docs/plutus-backend/intro.md`) exposes 5 REST endpoints (`/api/transactions`, `/api/balance`, `/api/rewards`, `/api/redeem`, `/api/analytics`). Adding public/consumer-facing endpoints or authentication middleware is a backward-compatible extension.
- The existing docs are complete: problem decompositions (`docs/plutus/`, `docs/plutus-backend/`, `docs/plutus-client/`, etc.), IPDs, ITDs, and decision records (`DECISIONS.md`). Any expansion must maintain this documentation discipline.

## Goals

- Apply the `fintech-ui-2026` design skill to at least one new or redesigned feature (e.g., a user settings/dashboard page, a public analytics view, or a redesigned rewards catalogue).
- Make Plutus externally valuable without depending on `hackerrank-orchestrate` or `superstore-erp`: consider a public API (`/api/public/*`), multi-user authentication (via Supabase Auth), or a deployable demo that others can interact with independently.
- Preserve the existing single-user demo functionality — no feature regression.
- Maintain documentation quality: any new significant feature follows the problem tree → IPD → ITD → implementation workflow (`CLAUDE.md`).
- Keep the scope manageable; this folder (`docs/plutus-expansion/`) provides the high-level problem tree. Deeper decomposition for particular domains (multi-user auth, public API, design system expansion) should live in new sub-folders if needed.

## Non-goals

- Deep integration with `hackerrank-orchestrate` (LangGraph pipeline) or `superstore-erp` (React Native billing). These are separate projects with independent lifecycles.
- Rebuilding the core table, chart, or rewards mechanics — these are complete (`README.md` Done list).
- A full multi-tenant production system with billing, role-based access, or compliance — this remains a demo with expanded value, not a commercial product.
- Replacing the `fintech-ui-2026` skill — it is applied, not replaced.
- Adding mobile apps or separate codebases.

## Constraints

- Must use the existing tech stack: Next.js + TypeScript, Tailwind CSS v4, Zustand, SWR, Chart.js, FastAPI, PostgreSQL (Supabase), Python.
- Must preserve the documentation workflow (`CLAUDE.md`): every significant feature starts with `intro.md`, builds a focused problem tree, creates IPDs/ITDs, then implements.
- Must not break the existing single-user demo (`docs/plutus/intro.md` assumptions #1, #2, #7 remain valid unless explicitly changed).
- Must respect the 24-hour time-box philosophy (`docs/plutus/intro.md`): polish a smaller feature set rather than half-building breadth.

## Assumptions

1. The user wants Plutus to stand on its own — not as a dependency of other hackathon/assessment projects, but as a shareable artifact.
2. Multi-user capability (even basic, single-tenant) and a public API are sufficient to make it "less isolated" without requiring cross-project integration.
3. The `fintech-ui-2026` skill (`memory.md`: `fintech-ui-2026-skill.md`) provides reusable design patterns (animation, micro-interactions, signature moments) that can enhance Plutus without a full redesign.
4. The existing `README.md`, `DECISIONS.md`, and `AI-USAGE.md` set a high documentation bar; any expansion must match or exceed it.
5. New feature folders (`docs/plutus-expansion/*/`) may be needed for deeper decomposition of particular domains (auth, public API, design expansion), but this folder (`docs/plutus-expansion/intro.md`) remains high-level.

## Problem tree

```text
How can Plutus become less isolated and more valuable as a standalone project?
├── What external value should Plutus provide — public API, multi-user demo, or design-system reference?
├── How should the fintech-ui-2026 design skill be applied — redesigned page, new feature, or animation enhancement?
├── What multi-user or authentication mechanism fits the existing Supabase setup without over-engineering?
├── How should new documentation (IPDs/ITDs) trace back to this problem tree?
└── What is the minimum viable scope that preserves the demo's quality and avoids feature creep?
```

## Open questions

1. Should the expansion focus first on a redesigned/rebuilt feature (applying `fintech-ui-2026`) or on adding external utility (public API, multi-user)?
2. Should multi-user support use Supabase Auth (built-in) or remain simulated (no real login) with a multi-user data model?
3. Should the `fintech-ui-2026` skill be applied to the existing transactions/rewards pages, or to a new page (e.g., a user dashboard or public analytics view)?
4. Should new sub-folders (`docs/plutus-expansion/auth/`, `docs/plutus-expansion/public-api/`, `docs/plutus-expansion/design-expansion/`) be created for deeper decomposition, or should all questions stay within this single folder?
# Plutus Expansion + Auth Door — Collapsed / Updated

## Previous state (collapsed)
- `docs/auth-door/` removed; content merged into this folder (`auth-door-merged/intro.md`).
- `docs/plutus-expansion/` retains multi-user auth spec, middleware design, and correction notes.

## KISS / Design simplification applied (post-auth-door + post-expansion)
- `user_profiles` table removed entirely. Supabase Auth UUID used directly as user identifier.
- Schema (`server/schema.sql`): `transactions.user_id` (TEXT, Supabase UUID), `redemptions.user_id` (TEXT, Supabase UUID). No `user_profiles`, no `auth_sub`, no integer FKs.
- Middleware (`main.py`): `get_current_user_id` extracts `sub` from JWT directly. No database lookup — the JWT carries the identity.
- Seed (`seed.py`): signs up user in Supabase Auth, uses returned UUID as `user_id` for transactions.
- Endpoints (`main.py`): `/api/login`, `/api/register` return `user_id` (UUID). Protected routes filter by `user_id` directly.
- Docs (`plutus-expansion/ipds/multi-user-auth.md`, `itds/auth-middleware.md`, `itds/auth-middleware-correction.md`) describe the intermediate `user_profiles` design; current implementation supersedes that — direct UUID, no mapping table.
