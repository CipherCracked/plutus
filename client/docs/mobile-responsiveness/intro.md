# Mobile Responsiveness — Problem Decomposition

## Problem statement

The application, designed for a 2560px desktop viewport, degrades significantly
on mobile screens (≤360px). This affects all three views — Transactions,
Analytics, and Rewards — as well as the shared Header and Navigation components.

On the **Transactions** page, the combined vertical footprint of the header,
filter bar, sticky table header, and result-count actions pushes the actual
transaction content into a small scrollable window. The table's column widths
(260px merchant alone) overflow the 360px viewport, the dropdown triggers have
touch targets smaller than 44px, and the transaction detail slide-over doesn't
adapt to narrow screens.

On the **Analytics** page, summary cards (`grid-cols-3`), charts (`grid-cols-2`),
and a 256px chart height produce cramped, unreadable layouts on mobile. On the
**Rewards** page, the reward catalogue grid (`grid-cols-2`) and small button
padding (`py-1.5`) create crowded cards and undersized tap targets. The
**Navigation** bar has 32px-tall buttons that fall below the 44px minimum touch
target.

## Background and context

The transactions page is built as:

```
Header (48px height) — full logo + "PLUTUS" wordmark
├── Filter bar — 3-group grid, 8 controls, active pills
│   ├── Active filter pills (variable height)
│   ├── Merchant search input
│   ├── Category / Status / Payment dropdowns (3)
│   ├── Date From / Date To pickers (2)
│   ├── Min / Max amount inputs (2)
│   └── Results count + Clear all button
├── Sticky table header (44px) — 6 columns
│   ├── Date (140px)
│   ├── Merchant (260px)       ← overflows 360px viewport by itself
│   ├── Category (140px)
│   ├── Amount (120px)
│   ├── Coins (100px)
│   └── Status (140px)
└── Virtualized table body (48px rows)
    ├── 9,960 rows, ~48px each
    └── TransactionDetail slide-over (side panel)
```

**Desktop viewport budget (2560px):**
- Header: 48px
- Filter bar: ~160px
- Table header: 44px
- Table rows: 48px each × ~12 visible = ~576px
- **Total used: ~828px out of 1320px content area — comfortable**

**Mobile viewport budget (360px × 640px):**
- Header: 48px
- Filter bar (stacked): 400–500px
- Table header: 44px
- Table rows: ~40px each (squeezed) × ~2 visible = ~80px
- **Total used: ~572–672px — filter bar alone exceeds the table's visible area**

Specific mobile issues identified:

1. **Filter bar vertical overflow** — 8 controls + pills stack into 15+ rows on mobile,
   consuming 400–500px of the 640px viewport.
2. **Table column overflow** — merchant column alone is 260px; the total column width
   (900px desktop) does not fit in 360px and only takes ~50% of a wider desktop screen.
   The current `overflow-x-hidden` on the scroll container clips content rather than
   enabling horizontal scroll, making columns unreadable.
3. **Touch target undersizing** — dropdown triggers are `h-8` (32px) with small text,
   checkboxes are `h-3 w-3` (12px). The 44px minimum touch target (WCAG) is violated
   across all pages (Table, FilterBar, Analytics charts, Rewards cards, Navigation buttons).
4. **Header wasting space** — the full logo variant (`sm` size = 240×80px) on a 360px
   screen takes up nearly a third of the screen width and a lot of vertical space.
5. **TransactionDetail slide-over** — positioned as a side panel, on mobile it may
   cover the full screen or be positioned off-screen.
6. **Sticky header on scroll** — the 44px sticky table header eats into scroll space
   on mobile where viewport real estate is precious.
7. **Analytics grid stacking** — summary cards (`grid-cols-3`) and charts
   (`grid-cols-2`) with `h-64` charts overcrowd a 360px screen.
8. **Rewards grid** — reward catalogue (`grid-cols-2`) and button padding
   (`py-1.5`) produce cramped cards and undersized tap targets on mobile.

## Goals

- The entire above-the-table UI (header + filter + table header) must occupy no more
  than 30% of viewport height on a 360px screen in the default (collapsed) state.
- All 8 filter controls must be accessible on mobile, but not all need to be visible
  simultaneously — a collapse/expand interaction is acceptable.
- The table must show at least 4–5 transaction rows simultaneously on a 360px screen,
  either through column resizing or horizontal scrolling.
- All interactive elements (dropdowns, checkboxes, sort buttons, pills) must meet
  the 44px minimum touch target size or be padded to reach it.
- The header must adapt to mobile — either icon-only or a more compact full logo.
- The TransactionDetail panel must work as a full-screen or bottom-sheet overlay on
  mobile, not a side panel.
- No feature regression on desktop — the desktop layout and behavior remain unchanged.
- Raw-aesthetics visual language (sharp edges, monospace, high contrast) must be
  preserved in all responsive states.

## Non-goals

- Adding new filter types or changing the filter data model.
- Rebuilding the virtualized table with a different library — `@tanstack/react-virtual`
  stays.
- Changing the underlying data model or API contract.
- A separate mobile-only page or separate codebase — the same component tree serves
  both viewports via responsive Tailwind classes.
- Changing the dark-first color scheme or theme tokens from `globals.css`.

## Constraints

- The `sm:` breakpoint is 640px; mobile constraint is 360px (assignment minimum width).
- Tailwind CSS v4 is the only styling toolset.
- The `@tanstack/react-virtual` table must retain its virtual height calculation and
  scroll container.
- The Zustand 10k-row cache must persist — filtering stays instant client-side.
- The page is rendered in all three states: loading skeleton, empty results, and data.
  The mobile solution must work in all three.
- The Header component is shared across the app — header changes must not break
  other pages.

## Assumptions

1. The mobile user is either browsing transactions or actively filtering — they
   rarely need all 8 filters and 6 table columns visible simultaneously.
2. The user on mobile scans transaction lists vertically, not horizontally.
3. Touch targets below 44px are genuinely problematic (not just a guideline) —
   especially the checkbox inputs inside dropdowns.
4. The TransactionDetail slide-over on mobile works better as a full-height panel
   or bottom sheet rather than a side panel.
5. The logo in the header can be icon-only on mobile without losing brand recognition,
   since the icon variant already exists.

## Problem tree

```text
Mobile viewport (360px) is too narrow for all views (Transactions,
Analytics, Rewards) plus the shared Header and Navigation
├── How should the filter bar adapt to show 8 controls without consuming
│   more than ~150px of vertical space on mobile?
├── How should table columns resize or reflow to fit a 360px width
│   while remaining scannable (at least 4–5 rows visible)?
├── What touch targets in the current UI fall below the 44px minimum,
│   and how should they be padded or resized for mobile?
├── How should the header (logo) adapt on mobile — icon-only or
│   compact full logo?
├── How should the TransactionDetail panel behave on mobile — full-screen
│   overlay, bottom sheet, or modal dialog?
├── Should the sticky table header scroll away on mobile or stay visible?
├── How should the Analytics summary cards and charts reflow on a 360px
│   screen, and should chart heights shrink?
└── How should the Rewards grid and card/button layout reflow on mobile,
    and should button tap targets enlarge?
```

## Open questions

1. **Filter bar collapse strategy**: Should the mobile filter bar collapse into a
   summary bar ("3 filters | Clear all") that expands to show all controls in an
   internal scroll container, or should it be a full-height overlay that covers
   the table when open (like a mobile drawer)?

2. **Table column strategy**: Should columns shrink proportionally to fit 360px
   (merchant from 260px to ~90px, with text truncation), should the table allow
   horizontal scrolling with `overflow-x-auto`, or should the table reformat into
   a card-list layout on mobile (each transaction as a self-contained card)?

3. **Header logo on mobile**: Should the header use the icon-only logo variant on
   mobile (saving ~164px of vertical space vs the `sm` full variant), and should
   there be a fallback page title text "Transactions" when the wordmark is hidden?

4. **Touch target remediation**: Which specific controls need padding — the dropdown
   triggers (currently 32px height), the checkboxes inside dropdowns (12px), the
   sort buttons in the table header, or the filter pills themselves?

5. **TransactionDetail on mobile**: Should the detail panel be a `position: fixed`
   full-screen overlay, a `translate-y-[calc(100%-xxx)]` bottom sheet that snaps,
   or a modal dialog with a backdrop? What gesture dismisses it (swipe down, backdrop
   tap, or an explicit close button)?
