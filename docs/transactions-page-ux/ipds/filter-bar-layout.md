## Problem to solve

The transactions page currently packs 8 filter controls (merchant search, category, status,
payment method, date from, date to, min amount, max amount) into a single row that wraps
on narrower screens. This creates three UX problems:

1. **Layout shifts**: dropdown menus render inline (not `position: absolute`), so opening
   one pushes sibling controls down — the entire filter bar jumps.
2. **Scanning difficulty**: 8 controls with equal visual weight make it hard to find the
   active filter or see the overall filter state at a glance.
3. **Narrow-screen breakage**: at 360px width, the flex-wrap row creates a ragged, uneven
   stack that feels accidental rather than intentional.

The question is: how should the filter controls be organized, grouped, and surfaced to
remain scannable and stable across desktop (2560px) and mobile (360px) viewports — and
should the filter bar be always visible, collapsible, or docked?

## Options

### Option 1: Single dense bar, always visible, dropdowns anchored with absolute positioning

Keep all 8 controls visible at all times in a single flex-wrap row. Fix the layout-shift
bug by making dropdowns `position: absolute` with a portal. Group related controls
visually (e.g., date range in a fieldset-like container, amount range in another).

- *How it feels:* Maximum information density — every filter is immediately accessible
  with one click. Feels "pro" and spreadsheet-like, matching the raw-aesthetics theme.
- *When it makes sense:* The user is a finance professional who filters frequently and
  needs to see all options simultaneously.

### Option 2: Collapsible filter bar with a summary badge

A compact header at the top shows "3 filters active" (or "All filters" when none active).
Clicking expands a full filter panel. The expanded panel uses a 2-column grid on desktop
and a single column on mobile.

- *How it feels:* Less cluttered — the page breathes more. But adds a click to access
  filters, and the summary badge needs to feel informative, not hidden.
- *When it makes sense:* The user primarily browses transactions and filters occasionally.

### Option 3: Always-visible bar with grouped controls + a "clear all" action

Organize the 8 controls into 3 logical groups: Search (merchant), Filter (category, status,
payment), and Range (date from/to, min/max amount). Each group has a subtle label or icon.
The bar stays visible but uses consistent horizontal spacing and a divider between groups.
Add a "Clear all" button that's always visible when ≥1 filter is active.

- *How it feels:* Organized without hiding anything. The grouping creates visual breathing
  room without requiring interaction. "Clear all" is discoverable.
- *When it makes sense:* Filters are used frequently but the user benefits from visual grouping
  over a flat list.

### Option 4: Popover-based filters with a persistent summary bar

A thin always-visible bar shows active filter badges (e.g., `🟢 Shopping  🟡 SUCCESS  ₹500+`).
Clicking any badge or a "+ Add filter" button opens a popover where the user can add/remove
filters. The popover uses a grid layout with clear sections.

- *How it feels:* Clean, modern, and very space-efficient. The badges make the active state
  visible. But the popover interaction adds steps — not as "immediate" as a direct control.
- *When it makes sense:* The screen is small or the user wants a distraction-free browsing
  experience with filters available on demand.

## Reasoning

**Option 3 (grouped always-visible bar) is the best choice** for this context.

The assignment explicitly requires all 8 filter types (category, date range, amount range,
status, combined filters) to be available. Hiding them behind a collapsible panel adds
friction for a dashboard where the user is expected to filter frequently. A popover summary
bar is elegant but adds click steps — the brief says "search merchant names as they type"
which implies immediate filter access.

The current single-dense-bar approach isn't wrong in spirit — it matches the raw-aesthetics
"control panel" feel. The problem is that it's unorganized (no grouping, no clear active
state, no way to reset). Adding visual grouping + a "clear all" button fixes the scannability
without hiding anything.

This pairs well with the raw-aesthetics trend: a monospaced, grid-aligned filter bar with
sharp dividers between groups reads as "trustworthy control surface," not "consumer app."

## Tradeoffs

- **Option 1** (dense bar) is the closest to the current implementation but doesn't solve
  scannability or the missing "clear all" pattern. Requires CSS fixes for dropdown positioning
  (handled in the dropdown implementation ITD) but doesn't address the organization problem.
- **Option 2** (collapsible) adds an interaction step. The user explicitly wants dense filter
  access — a collapse/expand pattern fights that. The summary badge needs its own interaction
  model, adding complexity.
- **Option 3** (grouped bar) requires careful spacing and divider placement. On 360px, the
  grouped bar will stack — handled by the responsive ITD. The "clear all" button needs to be
  visually distinct but not dominant.
- **Option 4** (popover summary) introduces a "badge as filter target" pattern. Editing a
  badge (e.g., change category from "Shopping" to "Food") requires a popover, which breaks
  the "as-you-type" merchant search flow.

## Notes

- The filter bar already has: merchant search input, category/status/payment multi-select
  dropdowns, date from/to pickers, min/max amount inputs, and a "CLEAR" button. The work is
  to group and organize them, not add new controls.
- "Clear all" should reset to default filters and be always visible when any filter is active.
- On desktop, the 3 groups should sit on a single row with subtle vertical dividers.
- On mobile (360px), groups stack vertically with section labels.
- Referenced in: `docs/transactions-page-ux/itds/dropdown-implementation.md`
- Referenced in: `docs/transactions-page-ux/itds/responsive-filter-bar.md`
