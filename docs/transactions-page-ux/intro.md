# Transactions Page UX — Problem Decomposition

## Problem statement

The transactions dashboard page works functionally (10k rows render and filter
correctly) but does not feel good to use. The primary pain point reported by
the user is that **dropdown filter menus behave very weirdly**: they close
prematurely when the user moves the mouse from the trigger button to the
options list, and opening one pushes other filter elements out of position.
Beyond dropdowns, the page feels dense and unpolished — the filter bar packs
eight controls into a single row, the empty state is barely visible, and the
overall "raw aesthetics" styling comes across as unfinished rather than
intentionally minimal. The root cause is that frontend code was written quickly
to hit functional milestones (virtualization, store wiring) without pausing to
consider the user's actual interaction flow.

## Background and context

The page renders a virtualized table of 9,960 transactions using
`@tanstack/react-virtual` with a Zustand store holding the full in-memory
dataset. Filtering is client-side via `getFiltered()` (sub-millisecond), so
there's no network latency to mask. The filter bar (`FilterBar.tsx`) contains:

1. Merchant search (text input)
2. Category dropdown (multi-select)
3. Status dropdown (multi-select)
4. Payment method dropdown (multi-select)
5. Date from (date picker)
6. Date to (date picker)
7. Min amount (number input)
8. Max amount (number input)

Three of those are `DropdownFilter` components that share an identical
implementation:

- The dropdown list renders inline (not `position: absolute`), so opening it
  pushes sibling controls down — causing layout shift.
- Closing is triggered by `onMouseLeave` on the dropdown container, which fires
  as soon as the cursor leaves the trigger button to move to the options. This
  makes it nearly impossible to select anything.
- There is no click-outside handler, no Escape key handler, and no fixed
  positioning anchoring the dropdown to its trigger.
- No max-height or overflow styling means long option lists (8 categories, 5
  payment methods) could overflow off-screen.

## Goals

- Dropdowns open without shifting the layout and stay open until the user
  explicitly dismisses them (click outside, Escape, or selection complete).
- The filter bar remains usable and scannable — controls are grouped so the
  user can see what's filtered at a glance.
- The page feels intentionally designed, not rushed or half-finished.
- All interaction states (hover, focus, active, selected) provide clear visual
  feedback.
- The page works at 360px viewport width (the assignment's responsiveness
  constraint).

## Non-goals

- Adding new filter types beyond what already exists (date, amount, category,
  status, payment method, search).
- Server-side filtering or pagination (the full-dataset caching approach is
  already an accepted ITD decision).
- Complete visual redesign of the table itself (sorting, virtualization, and
  row rendering are functionally correct).
- Changing the underlying data model or API contract.

## Constraints

- The 10k-row Zustand cache must persist — filtering must stay instant
  (sub-5ms). No network calls per filter interaction.
- Raw aesthetics visual language (sharp edges, high contrast, dark-first) must
  be preserved — the fix is interaction-focused, not a theme overhaul.
- Tailwind CSS v4 is the only styling toolset available.
- The `@tanstack/react-virtual` row positioning is correct — virtual rows are
  `position: absolute` and must not be disrupted by filter bar interactions.

## Assumptions

1. The user wants a desktop-class experience (they are on a 2560px monitor) but
   the page must still degrade to 360px.
2. The "raw aesthetics" styling is intentional — the issue is interaction bugs
   and density, not the visual language itself.
3. Multi-select dropdowns are the correct pattern for category/status/payment
   filters (not single-select or search-within-dropdown).
4. The user prefers fixing existing components rather than replacing them with
   a library component.

## Problem tree

```text
Transactions page UX feels broken
├── How should dropdown menus behave so they don't close prematurely or
│   shift the layout?
├── How should the 8 filter controls be organized and grouped to remain
│   scannable on both desktop and 360px viewports?
├── What is the minimum set of interaction states (hover, focus, active,
│   selected, empty) the page must communicate clearly?
├── Should the filter bar be always visible, collapsible, or docked at the
│   top with overflow scroll on narrow screens?
└── What constitutes a "feels good" interaction for this page — and which
    specific micro-interactions (filtering, selection, row hover) currently
    fall short?
```

## Open questions

1. Should dropdowns use a portal (rendered outside the table scroll
   container) to avoid clipping by `overflow-y-auto`?

2. Should the filter bar collapse into a compact summary (e.g., "3 filters
   active") on narrow screens, or remain fully expanded with horizontal
   scroll?

3. Is the current empty state ("◻" icon + "No transactions match your
   filters") sufficient, or should it include a more prominent illustration
   or guidance on which filter to clear?

4. Should multi-select checkboxes support bulk select (select all in list,
   select none) within the dropdown, or is individual toggle sufficient?
