## Problem to solve

The Digital Alpha assignment evaluates "CSS and UI craft" heavily (second only to
frontend engineering). The Setproduct 2026 Data Table Guide provides a 19-item
pre-ship checklist. Running the current TransactionTable against this checklist
reveals several gaps:

1. **No tooltip on truncated cells** — cells use `text-ellipsis` but have no
   `title` attribute or tooltip component. When a merchant name is truncated,
   the user cannot see the full value without opening the detail overlay.
   Setproduct: "The safe default is a single line with an ellipsis, paired with
   a tooltip that reveals the full value on hover and on keyboard focus."

2. **No keyboard navigation in the table body** — rows are focusable (`tabIndex={0}`)
   and Enter opens detail, but there is no arrow-key navigation between rows.
   Setproduct checklist: "Keyboard navigation is the backbone."

3. **Empty state doesn't differentiate first-run vs no-results** — the empty
   state says "No transactions match your filters" regardless of whether
   filters are active. Setproduct: "A new user with no records yet and a filter
   that returns nothing are two different empty states."

4. **No focus trap in Overlay** — the Overlay component dismisses on Escape
   and backdrop click, but focus can escape to background elements. Setproduct:
   "A visible focus ring that never depends on color alone."

5. **No ARIA live region for sort/filter changes** — when a user sorts or
   filters, screen reader users get no announcement. Setproduct: "Announce
   dynamic changes through a polite live region."

6. **No density modes** — there is only one row height. Setproduct recommends
   shipping "compact, comfortable, and spacious" as user settings.

## Options

### Option 1: Targeted accessibility + polish additions

Add the minimum items needed to pass an accessibility review:
- `title` attribute on truncated cells (simple, native browser tooltip).
- Arrow-key navigation between table rows (up/down keys, Enter for detail).
- Split empty state into two variants (first-run vs no-results).
- Add focus trap to the Overlay component using a `tabWrap` JS pattern.
- Add an ARIA live region for sort/filter announcements.

- *How it feels:* The table behaves like a native app — keyboard users can
  navigate with arrow keys, screen readers announce changes, tooltips reveal
  truncated values. No visual redesign.
- *When it works:* When the evaluator checks for accessibility compliance
  but the primary review is on functional correctness and visual polish.
- *Cost:* ~3-4 hours of focused work on 4-5 files.

### Option 2: Full Setproduct checklist compliance

Implement every item from the 19-item checklist:
- Density modes (compact/comfortable/spacious) with persistence.
- Column resizing handles.
- Column hiding/reordering.
- "Select all matching rows" with scope awareness.
- Bulk actions toolbar.
- Range selection (Shift+click).

- *How it feels:* An enterprise-grade data table like Linear or Airtable.
- *When it works:* When the evaluator is comparing against Figma templates
  and wants to see "depth of implementation."
- *Cost:* 8-12 hours — well beyond the 24-hour assignment budget.

### Option 3: No accessibility additions

Keep the table as-is. The core functionality works with mouse/touch.
Focus all remaining time on completing the nice-to-have items (server-side
pagination documentation, optimistic balance updates).

- *How it feels:* The table is usable but not fully accessible. A keyboard-
  or screen-reader user would struggle.
- *When it works:* When the evaluator does not test accessibility.
- *Risk:* The assignment explicitly states: "Accessibility touches such as:
  Semantic markup, Keyboard support" are listed under "nice extras." If the
  evaluator tests keyboard navigation and finds it broken, it reflects poorly.

## Reasoning

**Option 1 (targeted accessibility + polish additions) is the best choice**
for the remaining time budget.

The Digital Alpha assignment evaluation order is:
1. Frontend engineering (40%)
2. CSS and UI craft (30%)
3. Handling the full 10k-row dataset (20%)
4. Judgment behind assumptions (10%)

Accessibility is listed under "nice extras" but the Setproduct guide — which
the project already references in `mobile-column-resizing.md` — makes it clear
that "semantic markup" and "keyboard navigation" are part of "UI craft," which
is the second-weighted category. A broken keyboard nav is worse than a missing
feature.

### Why targeted, not full checklist

The 24-hour window means scope discipline. Setproduct says: "A tight,
well-built core beats every feature half-done." The core table works. The
targeted additions (tooltip, arrow keys, empty states, focus trap, live region)
cover the highest-impact accessibility gaps at ~3-4 hours of work. Full
checklist compliance (density modes, column resizing, bulk actions) would
consume the remaining time with diminishing returns on the assignment score.

### Why add focus trap to Overlay now

The Overlay component is already used for the mobile filter drawer and the
TransactionDetail panel. Adding a focus trap is a ~20 line addition that
makes both overlays accessible. It's a multiplier — one fix helps two features.

### Why arrow-key navigation matters

The table is a grid of financial data. Finance professionals expect keyboard
navigation (they live in spreadsheets). Arrow keys + Enter for detail is the
minimum viable pattern. It also satisfies the "Keyboard support" item under
"nice extras."

### Why split empty states

The current empty state says "No transactions match your filters" even when
no filters are active (first run). This is confusing — the user hasn't filtered
anything, the message implies they should adjust filters they haven't set.
Split into:
- **First run:** "No transactions yet. Check back after your first payment."
- **No results:** "No transactions match your filters. Try adjusting or
  clearing them." (with the "CLEAR FILTERS" button as the CTA)

## Tradeoffs

- **Title attribute vs custom tooltip** — `title` is a one-liner, works with
  screen readers, and requires zero CSS. A custom tooltip component would be
  more polished but adds complexity and 200+ lines of code.
- **Arrow-key nav via roving tabindex vs. simple focus management** — a full
  roving tabindex (where only the currently-focused row is in tab order) is
  the "proper" pattern but adds state management. A simpler approach: keep
  all rows tabbable with arrow-key `focus()` calls.
- **Focus trap vs no focus trap** — without a focus trap, pressing Tab while
  the detail overlay is open moves focus to elements behind the overlay. A
  basic `focus-trap` implementation wraps Tab focus within the overlay.
- **ARIA live region** — a single `aria-live="polite"` div that updates when
  sort/filter changes occur. Minimal markup, big accessibility win.
- **Density modes** — deferred as a non-goal. The single row height is
  adequate for the assignment.

## Notes

- The Overlay component is in `src/components/ui/Overlay.tsx` (created during
  the mobile-responsiveness work).
- The table rows are in `src/components/transactions/TransactionTable.tsx`.
- The FilterBar empty state is in `src/components/transactions/FilterBar.tsx`.
- Referenced in: `docs/table-performance-enhancement/intro.md`
