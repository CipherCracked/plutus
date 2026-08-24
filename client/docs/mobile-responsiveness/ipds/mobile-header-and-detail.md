## Problem to solve

The mobile viewport (360px × 640px) must accommodate the page header, filter
bar, table, and the transaction detail panel. Two elements need specific mobile
adaptation:

1. **Header**: The current header uses `<Logo variant="full" size="sm" />` which
   renders a 240×80px SVG. On a 360px screen, this logo occupies 67% of the screen
   width and pushes the filter bar + table down, wasting vertical space.

2. **TransactionDetail panel**: The current `<TransactionDetail>` is a side-panel
   slide-over (from `TransactionDetail.tsx`). On mobile, the side panel approach
   doesn't work — it would cover the table or be pinned off-screen.

The question is: how should the header adapt on mobile, and how should the
TransactionDetail panel behave on mobile screens?

## Options

### Option 1: Icon-only header + full-screen detail overlay

On screens below 640px, the header renders `<Logo variant="icon" size="md" />`
(32×32px) instead of the full 240×80px logo. The header height shrinks from
~80px to ~48px. The TransactionDetail panel, when opened, becomes a
`position: fixed; inset: 0` full-screen overlay with a close button in the top
right. The overlay has a scrim backdrop (per the raw-aesthetics anti-liquid-glass
70-85% opacity).

- *How it feels:* Maximum screen real estate for the table. The icon-only logo
  is recognizable (finance "P" mark) and 32px is still identifiable. The detail
  overlay is a familiar mobile pattern (like tapping an email in Gmail mobile).
- *When it works:* When vertical space is the primary constraint and the user
  needs every pixel for data. When the detail view is read-only (no quick
  switching between list and detail).

### Option 2: Compact full logo + bottom sheet detail

The header keeps a compact version of the full logo (maybe `size="xs"` or a
truncated wordmark), saving 40–50px vs the current `sm` size. The
TransactionDetail panel slides up from the bottom as a non-modal bottom sheet
that covers ~70% of the screen, per the NN/g bottom sheet guidelines.

- *How it feels:* Maintains brand visibility (full wordmark) while saving space.
  The bottom sheet preserves some context of the underlying table (the user can
  see the transaction row they tapped). The grab handle at the top is a familiar
  mobile gesture.
- *When it works:* When brand recognition matters (splash/landing feel) and users
  benefit from seeing the underlying data while reading detail.

### Option 3: Header title text + card detail overlay

Replace the logo entirely with a plain text title "Transactions" in the header
on mobile (icon + text). The TransactionDetail panel opens as a centered card
modal (not full screen) with a backdrop, sized to ~90% width and auto height.

- *How it feels:* Minimalist. The text header is the most space-efficient. The
  centered card feels like a dialog, which is appropriate for a "detail
  view" that the user opens and closes quickly.
- *When it works:* When the user prefers a utilitarian, data-terminal feel over
  brand expression on mobile. When detail views are brief (not deep navigation).

### Option 4: No header change + side panel adaptation

Keep the header as-is, but make the side panel responsive — on mobile, the
TransactionDetail panel becomes a bottom sheet that covers ~80% of the screen.
The logo stays `variant="full" size="sm"`.

- *How it feels:* Least effort to implement but preserves the vertical space
  waste from the logo. The bottom sheet is a well-tested mobile pattern.
- *When it works:* When the logo's brand weight is considered important enough
  to justify the space cost, and the detail panel is the only other change needed.

## Reasoning

**Option 1 (icon-only header + full-screen detail overlay) is the best choice**
for this context.

### Header: icon-only on mobile

The /fintech-ui-2026 skill says "Collapsing headers that shrink on scroll" and
"Minimal top bar — only essential actions visible." The icon-only logo at 32px
is the right call because:

1. The `variant="icon"` already exists in the `Logo` component — no new SVG
   needed.
2. At 360px screen width, 240px is 67% of the viewport — this is genuinely
   problematic for content layout.
3. The icon-only "P" mark is distinct and recognizable at small sizes (per the
   logo design iteration history). No page title text is shown alongside the
   icon — the user's context is clear from the active Navigation button and
   the page content below.

The NN/g bottom sheet article and the pencil-and-paper filter article both
emphasize that on mobile, every pixel of vertical space should serve a
functional purpose. The 80px full logo fails this test.

### Detail panel: full-screen overlay

The full-screen overlay is the better choice over the bottom sheet (Option 2)
because:

1. The TransactionDetail panel shows 6+ fields with merchant logo, payment info,
   timestamps, amounts, and notes. This is substantial content — a 70% sheet
   would require vertical scrolling inside the sheet, which the pencil-and-paper
   article warns against ("the whole screen gets refreshed at every click").
2. A full-screen overlay is simpler to implement correctly — no drag-to-expand
   gesture, no position calculation, no conflict with the table's scroll.
3. The user is viewing detail to understand a single transaction, not to compare
   with others — full focus is appropriate.
4. Per /fintech-ui-2026: "anticipate context" — when the user taps a row, they
   want to see that transaction's details. Full-screen delivers that intent.

The NN/g bottom sheet guidelines say: "Use [bottom sheets] for a few options or
some additional information" and "don't use them for displaying lengthy content."
Our detail panel is lengthy content — full-screen overlay is the correct pattern.

### Why not the other options

- **Option 2 (bottom sheet)** is the right pattern for short, transient
  interactions (like the filter drawer). But TransactionDetail is a read-heavy
  detail view with multiple fields. NN/g explicitly advises against bottom
  sheets for "lengthy content."
- **Option 3 (centered card modal)** doesn't maximize space utilization — a
  90% card still leaves margins and feels like a dialog, not a content view.
  Full-screen is more appropriate for data-dense content.
- **Option 4 (no header change)** preserves the 80px vertical waste from the
  logo. This is 20% of the viewport on a 320px-tall device — unacceptable for
  a data-heavy page.

## Tradeoffs

- **Option 1** means the merchant search and filter bar move down ~8px on
  mobile vs the current ~80px logo (the icon is 40px). This is a net saving of
  ~72px.
- The full-screen detail overlay means the user can't see the underlying table
  while reading details. This is acceptable — the user's intent is to focus on
  a single transaction, not compare.
- The icon-only logo provides a clean, minimal top bar. Page context is conveyed
  via the Navigation bar (active button) and the visible content.
- Referenced in: `docs/mobile-responsiveness/intro.md`
- Referenced in: `docs/mobile-responsiveness/ipds/mobile-filter-strategy.md`
- Referenced in: `docs/mobile-responsiveness/itds/mobile-overlay-implementation.md`
- Referenced in: `docs/mobile-responsiveness/itds/mobile-touch-targets.md`

## Notes

- Header breakpoint: `sm:` (640px). Below `sm`, use `Logo variant="icon" size="md"`.
  Above `sm`, keep `Logo variant="full" size="sm"`.
- No page title text in the mobile header — the icon-only logo plus the
  Navigation bar provides sufficient context.
- Full-screen overlay uses `position: fixed; inset: 0;` with `z-index` higher
  than the filter overlay but lower than any dropdown/portal.
- Overlay dismisses on: backdrop tap, Escape key, close button tap.
- Overlay content uses `overflow-y-auto` so long detail views can scroll.
- Referenced in: `docs/mobile-responsiveness/ipds/mobile-filter-strategy.md`
