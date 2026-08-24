# Mobile Responsiveness — Problem Decomposition

## Problem statement

The transactions page filter bar, which works well on a 2560px desktop viewport, becomes
unusable on mobile screens (≤360px). The three-group grid layout (Search, Filter, Range)
stacks vertically, producing 15+ rows of controls — merchant search input, three multi-select
dropdown triggers, two date pickers, two amount inputs, section labels, active filter pills,
and a "Clear all" button. This vertical stack consumes a significant portion of the viewport
height (roughly half the screen on a 360px × 640px device), leaving insufficient room for
the transaction table below. Scrolling to reach the table after applying filters is
frustrating, and the active filter pills (while necessary on desktop) add further vertical
density.

## Background and context

The filter bar was redesigned as part of the `transactions-page-ux` problem folder, where the
decision was made to use a responsive grid (`grid-cols-1 sm:grid-cols-3`) that stacks all
three groups vertically on screens below 640px. This was the correct approach for grouping
and scannability, but it was not evaluated against the actual viewport budget on a 360px
mobile device. The current page structure is:

```
Header (logo)
├── Filter bar (stacked on mobile: 11+ rows)
│   ├── Active filter pills (3+ rows if filters active)
│   ├── Merchant search
│   ├── Category dropdown
│   ├── Status dropdown
│   ├── Payment dropdown
│   ├── Date From
│   ├── Date To
│   ├── Min Amount
│   └── Max Amount
├── Results count + Clear all
└── Virtualized transaction table (remaining space)
```

On a 360px × 640px viewport, the filter bar alone can occupy 400–500px of vertical space,
leaving only 140–240px for the table — less than 5 rows of transactions.

## Goals

- The filter bar must occupy no more than ~25% of the viewport height on a 360px screen
  when collapsed, so the transaction table remains the primary focus.
- All 8 filter controls must remain accessible, but not all need to be simultaneously
  visible on mobile.
- The user must be able to see active filter state at a glance on mobile.
- Transitions between collapsed/expanded states must be smooth (150ms ease-out per the
  raw-aesthetics interaction language).
- No feature regression on desktop — the grouped grid layout remains unchanged.

## Non-goals

- Adding new filter types or changing the filter data model.
- Changing the desktop layout or the 3-group organization.
- Implementing a completely separate mobile view — the same component tree should serve
  both viewports via responsive Tailwind classes.
- Hiding or removing the active filter pills — they are required for granular undo
  (per the `transactions-page-ux` IPD decision).

## Constraints

- The `sm:` breakpoint is 640px; the mobile constraint is 360px (the assignment's
  specified minimum width).
- Tailwind CSS v4 is the only styling toolset.
- The `@tanstack/react-virtual` table below must retain its scroll container and
  virtual height calculation.
- Raw-aesthetics visual language (sharp edges, monospaced, high contrast) must be preserved.
- The filter bar is used inside `TransactionTable.tsx` which renders in both the
  loading skeleton, empty state, and data state — the mobile solution must work in all
  three contexts.

## Assumptions

1. The user on mobile is more likely to use search + one or two filters, not all 8
   simultaneously.
2. The "Clear all" button is used less frequently than individual filter removal, so
   it can be visually de-emphasized on mobile.
3. The active filter pills are valuable enough to remain visible, but can use a more
   compact style on mobile (smaller padding).
4. The user accepts one additional interaction step (tap to expand) on mobile in
   exchange for a much shorter collapsed filter bar.

## Problem tree

```text
Mobile filter bar takes too much vertical space
├── What is the optimal collapsed height for the mobile filter bar?
├── Should the filter bar collapse into a summary bar (e.g., "3 filters | Search | Clear")
│   and expand on tap, or should individual sections be collapsible/expandable?
├── How should the active filter pills be presented on mobile to stay scannable
│   while consuming minimal vertical space?
├── What is the minimum number of filter controls visible in the collapsed state
│   on a 360px screen, and which controls are essential?
└── Should the merchant search always be visible in the collapsed state (since the
    assignment requires "search merchant names as they type"), or can it also be
    hidden behind an expand interaction?
```

## Open questions

1. Should the collapsed filter bar show just the active filter count + result count,
   or should it show a compact summary of the active filter values (e.g., "Shopping,
   ₹500+")?

2. On mobile, when the user expands the filter bar, should all 8 controls appear at once
   (pushed table down temporarily), or should there be a scrollable container within the
   expanded panel to avoid pushing the table entirely off-screen?

3. Should the merchant search input be always visible in the collapsed mobile state
   (taking ~60px of vertical space) so the user can search without expanding?
