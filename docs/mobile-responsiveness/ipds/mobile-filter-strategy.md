## Problem to solve

On mobile (360px), the filter bar's 8 controls stack into 15+ vertical rows,
consuming 400–500px of the 640px viewport. This leaves only ~140px for transaction
rows — roughly 3 rows visible — and the active filter pills add further density.
The user cannot see their filtered results without extensive scrolling past
irrelevant controls.

The question is: how should the filter bar collapse or transform on mobile so
that all 8 filter controls remain accessible while consuming minimal vertical
space, and the active filter state remains visible?

## Options

### Option 1: Bottom drawer (modal, full-height on mobile)

A compact summary bar (36px) sits above the table showing "3 filters active" +
result count + a "Filters" button. Tapping "Filters" opens a bottom drawer that
slides up from the bottom of the screen, covering ~80% of the viewport. All 8
controls are laid out in a vertical scrollable form inside the drawer, with
grouped section headers (Search, Filter, Range). A sticky "Apply" + "Clear"
bar stays visible at the bottom of the drawer.

- *How it feels:* Familiar to mobile users (bottom drawers are native pattern).
  The drawer provides a dedicated, focused space for all filters. The summary
  bar above the table keeps the active count visible.
- *When it works:* When the user is comfortable with one-tap to open, one-tap
  to apply. Works well with batch-filtering behavior (apply all at once).

### Option 2: Collapsible sections (inline accordion)

The filter bar stays in place but each group (Search, Filter, Range) is an
accordion section. Only the expanded section's controls are visible. Users
tap a section header to expand/collapse it. The active filter pills remain
always visible at the top.

- *How it feels:* Familiar from desktop (accordion menus) but requires multiple
  taps to reach a specific filter. Saves vertical space but adds interaction
  depth.
- *When it works:* When users frequently switch between specific filter groups
  (e.g., "I filter by category most days, amounts occasionally").

### Option 3: Overlay modal (full-screen sheet)

Tapping a "Filter" FAB or the summary bar opens a full-screen modal overlay
(similar to Material Design's fullscreen dialog). The modal contains all 8
controls with proper spacing, grouped sections, and sticky Apply/Clear buttons
at the bottom. The background table is dimmed (scrim) to indicate modal state.

- *How it feels:* Maximum focus — the entire screen is dedicated to filters.
  No compromise on spacing or touch target size.
- *When it works:* When users need to review and adjust many filters at once,
  or when the filter panel is complex enough to warrant full attention.

### Option 4: Always-visible compact bar (condensed)

The filter bar is always visible but condensed: merchant search is a small
icon-button, the 3 dropdowns become icon-only buttons, date/amount are hidden
behind a single "Range" expando. Active filter pills are the primary indicator
of what's applied. Tapping any pill or the "Range" expando reveals that section
in-place.

- *How it feels:* Minimal but dense. Always visible but requires careful
  spacing. Users always see the active state without extra taps.
- *When it works:* When speed of access is more important than comfort — users
  who frequently toggle filters but don't need the full panel.

## Reasoning

**Option 3 (overlay modal / full-screen sheet) is the best choice** for this
context.

The research from Pencil & Paper's "Mobile Filter UX Design Patterns" identifies
the bottom drawer / full-screen overlay as the standard mobile pattern for
enterprise-grade filtering. The key insight is that batch filtering (apply once
after all selections) works better on mobile than live filtering — users hate
being "kicked out" of a filter flow by results refreshing mid-selection.

The full-screen overlay is superior to the bottom drawer (Option 1) because:
- The 360px viewport means even an 80% height drawer (~512px) would only show
  ~4-5 of the 8 controls without scrolling, and scrolling inside the drawer
  competes with body scroll.
- A full-screen modal gives every control full width and proper touch target
  spacing (44px minimum per WCAG).
- The user is a finance professional who may set 5+ filters in a session — they
  need to see all options clearly before applying.

The full-screen overlay is superior to the accordion (Option 2) because:
- Accordions require 4+ individual taps (open Category, select, open Status,
  select, open Payment, select) — too many interactions on a small screen.
- The summary bar above the table already shows the active count — there's no
  need for additional inline accordion sections in the main view.

The full-screen overlay is superior to the compact bar (Option 4) because:
- Icon-only controls on a 360px screen require tooltips or labels — defeating
  the space-saving purpose.
- The user explicitly stated they struggle with the dropdown behavior; further
  reducing the visual clarity of controls would worsen this.

### Mobile-first principle alignment

The /fintech-ui-2026 skill states: "Navigation moves to bottom tabs, edge
gestures for secondary actions, collapsing headers." A full-screen filter
overlay follows this principle — it's a dedicated interaction surface that
doesn't clutter the main viewport. The summary bar (showing filter count)
remains visible in the main view, following the "progressive disclosure"
pattern.

## Tradeoffs

- **Option 1 (bottom drawer)** is lighter weight but the height constraint
  means users will scroll inside the drawer — scrolling inside an overlay is a
  known mobile pain point (Pencil & Paper: "the whole screen gets refreshed at
  every click and you risk getting abruptly kicked out of the filter drawer").
  We mitigate by using a full-screen overlay instead.

- **Option 2 (accordion)** avoids the overlay entirely but adds interaction
  depth (tap → select → tap → select). The pencil-and-paper article warns
  against nesting: "We strongly recommend **not** using a bottom sheet to
  replace typical page-to-page user flows." The accordion doesn't avoid that
  pattern — it just nests it inline.

- **Option 3 (full-screen overlay)** temporarily hides the table behind a
  scrim. This is intentional — per the pencil-and-paper article, "if you're
  building filters for mobile, chances are you've already got a parallel feature
  running on your desktop version. Going mobile might mean you want to
  re-evaluate your fetching mechanism." We use batch filtering (apply all, then
  refresh) which means the table doesn't need to be visible during filter
  selection.

- **Option 4 (compact bar)** keeps everything visible but sacrifices touch
  target size and label clarity. The /fintech-ui-2026 skill's "Don't be afraid
  of big target areas" directly contradicts this approach.

## Notes

- The summary bar (shown when overlay is closed) displays: active filter count
  pills (e.g., "Shopping, FAILED, ₹500+") + result count + "FILTER" button.
  Tapping anywhere on the pills or the FILTER button opens the overlay.
- The overlay dismisses on: backdrop tap, Escape key, swipe-down gesture
  (if implemented), or the explicit "Close" button (per NN/g bottom sheet guidelines).
- The overlay uses `position: fixed; inset: 0` so it covers the entire viewport
  regardless of scroll position.
- Apply button is sticky at the bottom of the overlay — "Users shouldn't have
  to scroll to get to it" (Pencil & Paper).
- Clear button is also visible, always adjacent to Apply.
- Referenced in: `docs/mobile-responsiveness/intro.md`
- Referenced in: `docs/mobile-responsiveness/itds/mobile-overlay-implementation.md`
- Referenced in: `docs/mobile-responsiveness/itds/mobile-touch-targets.md`
