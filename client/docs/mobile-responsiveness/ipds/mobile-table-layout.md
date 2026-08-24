## Problem to solve

The transaction table has 6 columns totaling 900px of width (Date 140 +
Merchant 260 + Category 140 + Amount 120 + Coins 100 + Status 140). On a 360px
mobile viewport, this overflows by 540px. The current implementation uses
`overflow-x-hidden` which clips content and makes columns unreadable.

The question is: how should the table reflow on mobile to fit 360px while
maintaining scannability and the core use case of cross-record comparison
(sorting)?

## Options

### Option 1: Horizontal scroll with frozen first column

Keep the table as a grid, but wrap it in `overflow-x-auto`. The first column
("Date") is `position: sticky; left: 0` so it stays visible as the user scrolls
horizontally. Columns retain their relative widths but the table is wider than
the viewport.

- *How it feels:* Familiar to spreadsheet users. The table stays a table —
  columns align, sorting works, comparison is possible. The sticky first column
  maintains row context during horizontal scroll.
- *When it works:* When users need to compare values across many columns and
  can tolerate horizontal swiping. Works well with wide datasets.
- *Source:* Setproduct 2026 Data Table Guide: "Horizontal scroll keeps the table
  honest but asks people to swipe, so pair it with a frozen first column."

### Option 2: Card transformation (row → card)

Each transaction row is rendered as a self-contained card. Within each card,
the 6 fields are stacked vertically as labeled key-value pairs (Date: Aug 24,
Merchant: Amazon, Amount: ₹1,299, etc.). Cards are full-width, stacked
vertically, and scroll normally.

- *How it feels:* Reads like a list of transaction receipts. No horizontal
  scrolling needed. More whitespace per record. Lower density.
- *When it works:* When users read transactions one at a time, not comparing
  across records. Small datasets (<50 rows visible).
- *Source:* Setproduct: "Card transformation reads beautifully for small sets
  and falls apart past a few dozen records."

### Option 3: Hide non-critical columns

At 360px, collapse the table to 3 essential columns (Date, Merchant, Amount).
The other 3 (Category, Coins, Status) are hidden. Users can tap a row to see
the full detail in a slide-over panel that shows all 6 fields.

- *How it feels:* Dense, spreadsheet-like even on mobile. Users can quickly scan
  the 3 most important values. Missing fields are one tap away.
- *When it works:* When there's a clear priority among columns and users can
  remember the essential ones. When the dataset is large (10,000 rows) and
  density matters more than completeness.
- *Source:* Setproduct: "Hiding columns is the pragmatic default when some
  attributes clearly matter more."

### Option 4: Priority+ (show top columns, reveal rest on demand)

Show the 3 most important columns by default. Add a chevron or "+2" badge on
each row that, when tapped, reveals the remaining columns inline (expanding the
row to full width). Users choose how much detail to see per row.

- *How it feels:* Adaptive. Users scan quickly at first, then drill into
  individual rows as needed. More interactive than hiding columns.
- *When it works:* When column importance varies per user. When some users
  need detail and others need density.
- *Source:* Setproduct: "The priority+ pattern is the most adaptive: show the top
  few columns and tuck the rest behind a 'more' control."

## Reasoning

**Option 1 (horizontal scroll with frozen first column) is the best choice**
for this context.

The core task on the transactions page is comparing transactions — which column
has the highest amount, which are pending, etc. A table's value proposition is
cross-record comparison, and horizontal scroll preserves that while accepting
the swipe cost. The Setproduct guide explicitly calls this the strategy for
when "data integrity matters more than fit."

The frozen first column (Date) is essential because it's how users identify
which row they're looking at while scrolling horizontally. This is a standard
pattern in spreadsheet mobile apps and the user (a finance professional) is
already familiar with it.

### Why not card transformation

Card transformation (Option 2) is explicitly discouraged for large datasets.
The Setproduct guide says it "falls apart past a few dozen records" — and our
dataset has 10,000 rows. Even with virtualization, rendering cards for 40+
rows uses far more vertical space than a 32px compact row. The user is scanning
and comparing across records, not reading individual receipts.

### Why not hide non-critical columns

Hiding columns (Option 3) requires a secondary interaction (tap row → open
detail panel) for any field beyond the 3 visible ones. This breaks the
comparison flow — the user can't sort by "Status" and scan the status column
if it's hidden. The user's stated need is "scan and compare transactions,"
which requires all columns visible (or at least scrollable into view).

### Why not priority+

Priority+ (Option 4) adds per-row interaction complexity. The user must tap a
chevron on each row to see hidden columns — this disrupts scanning. With
10,000 rows, the user doesn't want to tap 50 chevrons to compare status values.
The horizontal scroll approach lets the user scroll once and see everything.

### Alignment with raw-aesthetics

The /fintech-ui-2026 skill says "grid-based layouts with clear column
alignment" and "high contrast." Horizontal scroll preserves the grid structure.
The frozen column is a standard spreadsheet pattern that finance professionals
recognize and trust.

## Tradeoffs

- **Option 1 (horizontal scroll)** means the 360px viewport will scroll
  horizontally. Users must swipe left/right to see all columns. This is a
  tradeoff for preserving the table format — acceptable for a data-heavy
  finance app where comparison matters.
- **Option 2 (cards)** provides the cleanest mobile UX (no horizontal scroll)
  but sacrifices density and comparison ability. At 10,000 rows, the card
  stack becomes very long and hard to scan.
- **Option 3 (hide columns)** is the most space-efficient but requires building
  a detail panel for hidden fields and breaks the sort/scenario mental model.
  The user would need to open each transaction to see all data.
- **Option 4 (priority+)** adds per-row interaction overhead. With virtual
  rendering, the expand/collapse state per row adds complexity to the
  react-virtual row keys and estimated heights.

## Notes

- The horizontal scroll container uses `overflow-x-auto` with `overflow-y-visible`
  so it doesn't fight the virtualization scroll container.
- Frozen column: `position: sticky; left: 0; background: var(--color-surface);`
  with a higher z-index so it appears above scrolled columns.
- Column widths at 360px: Date 100px, Merchant 120px, Category 100px,
  Amount 90px, Coins 70px, Status 90px. The user can scroll to see all 600px
  total. This is a ~1.7x horizontal scroll ratio — acceptable on mobile.
- Row height can shrink from 48px (desktop) to 40px (mobile) to show 2-3 more
  rows per screen.
- Referenced in: `docs/mobile-responsiveness/intro.md`
- Referenced in: `docs/mobile-responsiveness/itds/mobile-column-resizing.md`
- Referenced in: `docs/mobile-responsiveness/ipds/mobile-filter-strategy.md`
