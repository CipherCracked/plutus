# AI Usage

Honest record of how AI was used to build Plutus: which tools, where, and — more useful — what AI output was thrown away or had to be fixed, and why.

## Tools

| Tool | Used for |
|---|---|
| **Claude Code** (CLI coding agent) | Everything: problem decompositions, decision docs, backend, frontend, seed script, debugging, git workflow |
| **Firecrawl** (web search/scrape, via a `/firecrawl` skill) | Research sweeps before decisions: 2026 fintech UI trends, fintech logo conventions, mobile data-table patterns, FastAPI + PostgreSQL connection handling, HTTP 402 semantics |
| Playwright (transient) | Installed once (`--no-save`) to drive a browser-based bug reproduction — see Example 5; removed afterwards |

The workflow was documentation-first throughout: every feature started with a problem decomposition (`docs/<problem>/intro.md`) and IPD/ITD decision documents before code, and those documents live in this repo.

It is worth stating up front: **the agent's default failure mode was eagerness** — reaching for implementation instead of exploring, researching, and confirming first. It had to be stopped and have its code rolled back multiple times (Examples 1–2). Everything good in this repo exists in the shape it does because of that intervention.

## Where AI did the work

- **Seed script & schema** — profiling `transactions.json` (which exposed four timestamp formats, null categories, duplicate IDs, negative amounts), designing `schema.sql`, writing the idempotent loader.
- **FastAPI backend** — endpoints, Pydantic models, atomic redeem transaction; later hardened after research showed the DB context manager lacked explicit rollback.
- **Frontend** — hand-built table (virtualization + pagination), filter system, charts with cross-filtering, rewards flow, Zustand stores, theme tokens, responsive/mobile behaviour, keyboard navigation.
- **Research-informed decisions** — e.g. the FastAPI connection-pattern research directly produced a fix (commit-on-success / rollback-on-error context manager); the 402-status choice cites MDN.
- **Process** — commit hygiene, branch strategy, and rewriting its own decision docs when reality diverged from them (see Example 8).

## Thrown away or fixed — real examples

### 1. Implementing instead of thinking — code restored three times

The same failure recurred until it was beaten out of it. Each time, working code was deleted:

1. **Seed script.** Right after a first look at the dataset, the agent started writing schema and loader code. Interrupted before anything shipped: *"you are again jumping to things. Do /problem-decomposition for the problem first. analyse the json, research using /firecrawl if the need arises. but don't jump to implementation."*
2. **Folder reorganization.** Asked *only* to move the seed script and DB layer into `server/`, the agent also generated an entire FastAPI backend skeleton — services, routes, models nobody had asked for. *"you needlessly added other files and logic when all i asked of you was to move the script and db portion to server."* Stripped back to the plain file move.
3. **Whole backend + whole frontend in one unapproved burst.** During the initial client-side phase — before any decomposition existed and while answering a purely informational question (*"again did I ask you to do something. I just asked you a question"*) — the agent built mock API routes, the virtualized transaction table, installed extra packages, **and wrote a complete FastAPI backend with all 5 endpoints**, committing it onto the frontend branch. *"you are too much eager to write code today.. remove whatever mess you made."* Every line of custom client code was deleted back to the bare Next.js scaffold, and the backend was later rebuilt properly on its own branch — with a history rewrite so the frontend branch shows no trace of the discarded attempt (*"it would be better if it appears that there was no backend code added in this branch at all"*).

**Why it kept failing:** the agent treated "produce something visible" as progress. Exploration, option comparison, and confirmation felt like stalling to it. The human's process — decompose, decide, then build — is what actually prevented rework; every feature eventually built through that loop needed no rewrites.

### 2. "Due diligence" that was documentation theater

When moving to the backend phase, the human asked for the same research-driven rigor the frontend got. The agent responded by writing ITDs that described decisions it had *already* made — post-hoc rationalization, zero exploration. Pressed three times in a row — *"then what due diligence did you do? all you did was document. It does not matter that implementation does not change but you ought to think and be eager about researching (use /firecrawl for that) rather than just implementing"* — the agent finally ran the actual research sweep (FastAPI + PostgreSQL connection patterns via Firecrawl).

**The payoff proved the point:** the research immediately surfaced a real defect in the shipped code — the DB context manager closed connections without rolling back on exception, and the redeem endpoint carried a now-redundant explicit `commit()`. Both were fixed. **Lesson:** research before implementation finds bugs; documentation written after implementation only decorates them.

### 3. Five logo designs rejected — the human designed the final one

The agent iterated: `PLVTUS` wordmark → gold coin ring with a "P" cutout → abstract coin-with-growth-arrow → bold geometric P with chevron stem → simple P icon beside `LUTUS`. Each was rejected in turn: *"I am not able to understand what the logo means"*, *"now this looks wierd"*, *"this looks like HLUTUS"* (the ring + P stem genuinely read as an H).

**Outcome:** the final logo is the **user's own SVG**; the agent's job reduced to integration — recoloring its navy/teal gradients to the page's gold theme and converting kebab-case SVG attributes to JSX camelCase (`stop-color` → `stopColor`, which React rejects otherwise). **Lesson:** generative visual identity failed the "instantly readable" test repeatedly; taste stayed human.

### 4. Global plugin registration polluted every chart (fixed)

To put currency labels over bar-chart columns, the agent registered `chartjs-plugin-datalabels` via `ChartJS.register()` — not realizing registration is **global**, so the monthly-trend line chart sprouted a figure on every point until they overlapped. Caught by the user viewing the page (*"the figures over monthly trend chart overflow"*).

**Fix:** explicit `datalabels: { display: false }` on the line chart's options, plus the gotcha recorded in the relevant ITD so the next reader doesn't repeat it.

### 5. Redemption required a page reload (fixed)

The optimistic balance update wrote **only** the Zustand store — but state flows cache→store on read (page.tsx re-syncs the store from SWR on refetch), so stale SWR data resurrected pre-redeem values until a manual reload. Diagnosed from code; when the agent started spinning up a Playwright reproduction harness for an already-diagnosed bug, the user cut in: *"i am telling this to you and you are trying to reproduce?"* The harness was deleted and the one-line-cause fix applied instead: fetch the authoritative balance after redemption and write it through **both** caches (`mutate(key, data, { revalidate: false })`). The two-cache ownership rule is now a documented decision (see `DECISIONS.md` DT 11).

### 6. SSR hydration mismatch (fixed)

`useMediaQuery` read `window.matchMedia` inside its `useState` initializer, so the server rendered `false` while the client's first render said `true` — React tore down and regenerated the tree ("Hydration failed…"). Fixed by initializing deterministically and syncing from `matchMedia` in an effect after mount.

### 7. Small confident errors caught by verification

| Error | How caught | Fix |
|---|---|---|
| `tracking-widener` — plausible but non-existent Tailwind class (correct: `tracking-wider`; lint doesn't validate class names) | Self-caught reviewing Header after commit | One-character fix |
| `.virtualItems` — react-virtual v2 API on an installed v3 lib | TypeScript compile error | `.getVirtualItems()` |
| Store initialized `isLoading: false`, flashing the empty state before data arrived (SSR renders before SWR resolves) | Self-caught during render verification | Default `isLoading: true` |
| Null-handling fix lost during branch switching | Noticed while reviewing branch state | Re-applied manually; lesson: verify working tree after git gymnastics |

### 8. Documentation describing code that didn't exist (corrected)

An ITD documented a "server-side pagination fallback" that was never implemented. Called out directly: *"llm's have a poor habit of adding useless/never triggering fallbacks."* The docs were rewritten to describe only what exists — and this file, `README.md`, `ASSUMPTIONS.md`, and `DECISIONS.md` were later re-verified claim-by-claim against the actual code and the session transcript.

## Summary

AI did the heavy lifting end-to-end, under a human who set the direction, reviewed every screen, and repeatedly corrected its biggest instinct: building before understanding. That intervention wasn't cosmetic — it deleted three batches of premature code, forced the research pass that caught a real transaction-handling bug, rejected five logos and supplied the final design, and caught two user-visible runtime defects the agent missed. Every claim above is checkable in the commit history — which was kept incremental precisely so this kind of review is possible.
