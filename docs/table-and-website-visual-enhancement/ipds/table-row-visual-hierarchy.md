# Table Row Visual Hierarchy

## Problem to solve

The current transaction table renders every row identically — a flat
`border-b border-border` separator with `hover:bg-surface-hover` on hover.
There is no visual differentiation between rows beyond a 1px border line.

Per the fintech-ui-2026 skill: "Calm is credibility." The table needs
visual structure that helps users scan 50 rows per page and identify
anomalies (failed transactions, large amounts, unusual categories) without
adding decoration.

Per Stripe's pattern: "Color means state, nothing else." We must not use
color for decoration — only for encoding data.

Per Mercury's pattern: "Editorial calm — clean white space, consistent
typography, no visual noise." The table should feel calm, not busy.

The current state:
- Flat rows, identical visual treatment
- Only hover state on interaction
- No row differentiation (odd/even, category tint, amount magnitude)
- Status is bare colored text (addressed separately in status-badge-design.md)

## Options

### Option 1: Subtle odd-row background tint

Apply a very light background (`bg-surface-hover` at low opacity) to odd rows
only, creating a zebra-striping effect:

```tsx
// In renderRow:
clsx(
  index % 2 === 1 && "bg-surface-hover/30",
  "border-b border-border hover:bg-surface-hover",
)
```

- **How it feels**: Gentle zebra striping helps the eye track across wide
  columns without losing its row. This is a classic data-table pattern.
- **When it works**: When the table has 6+ columns of numeric/text data that
  users need to read horizontally.
- **Research**: Stripe, Revolut, and Brex all use zebra striping on financial
  tables. It's the most common pattern for wide data tables.

### Option 2: Alternating opacity on the border

Instead of background tint, alternate the border-bottom color's opacity:

```tsx
clsx(
  index % 2 === 0
    ? "border-border"
    : "border-border/50",
)
```

- **How it feels**: Subtler than background tint. The row separation is
  communicated through border weight, not background color.
- **When it works**: When the dark-first palette makes even a 30% tint too
  visible, and you want the quietest possible differentiation.
- **Research**: Some dark-mode-first designs (Notion, Linear) use border
  variants instead of zebra stripes on dark surfaces.

### Option 3: Category-based background tint

Use a very subtle background tint based on the transaction's category:

```tsx
const categoryColor = categoryColors[txn.category] || "bg-surface-hover/30"
// Map each category to a muted color at 5-10% opacity
```

- **How it feels**: Different spending categories get different subtle
  background tints — groceries in a muted green, transport in a muted blue,
  etc. This encodes data (category) through color.
- **When it works**: When users need to visually group transactions by category
  while scanning, and can learn the color mapping.
- **Research**: Some finance apps (YNAB, Monarch) use category color coding,
  but typically in a "pill" or "dot" format, not row-level background. Row-
  level category tinting can be confusing if there are many categories.

### Option 4: No row differentiation (keep flat)

Leave the table as-is — flat rows with only hover state. No zebra striping,
no category tint, no border opacity alternation.

- **How it feels**: Maximum calm, but the eye can wander when scanning across
  6 columns. Especially problematic for users with visual tracking issues.
- **When it works**: When the data is sparse (few rows per page) or when
  status badges and amount formatting already provide sufficient scan points.
- **Research**: Some minimalist dashboards (e.g., early Notion tables) omit
  row differentiation entirely.

## Reasoning

**Option 1 (subtle odd-row background tint) is the best choice.**

### Why subtle zebra striping

1. **Universal scanability**: Zebra striping is the most studied and proven
   technique for wide table readability. It helps the eye track horizontally
   across columns without losing its row — critical for a 6-column financial
   table.

2. **No color encoding conflict**: Per Stripe's rule "color means state,
   nothing else," zebra striping uses the neutral `surface-hover` token
   (a monochrome shift from `#121212` to `#1a1a1a`). It doesn't encode
   data — it just helps the eye read.

3. **Dark-mode-friendly opacity**: At 30% opacity on `bg-surface-hover`, the
   tint is barely perceptible — just enough to create a subtle texture change
   that aids scanning without creating visual noise. This aligns with
   "Anti-Liquid Glass: controlling opacity for functional depth."

4. **No cognitive load**: Unlike category-based tinting (Option 3), zebra
   striping requires no learning — the eye naturally uses it without needing
   to map colors to categories.

5. **Mercury alignment**: "Editorial calm — clean white space, consistent
   typography, no visual noise." Zebra striping at 30% is calm, not noisy.

### Why not category-based tint (Option 3)

While encoding data through color is powerful, row-level category tinting
introduces a cognitive mapping burden (what does this green tint mean?).
Category is already visible in the "Category" column — duplicating it as a
background tint creates redundancy and potential confusion with the status
badge colors. If we add category tinting, users might mistake the green tint
for "success" (matching the success badge).

### Why not border opacity (Option 2)

Border opacity alternation is extremely subtle — on the `#0a0a0a` background
with `#2a2a2a` borders at 50% opacity, some users won't perceive any
difference. Zebra striping (30% surface-hover on odd rows) is more robust
across vision types and display qualities.

### Why not no differentiation (Option 4)

With 50 rows per page and 6 columns, users need every aid to track rows.
The status badge enhancement (IPD: status-badge-design) provides one scan
point, but the eye still needs help moving across the full row width.

## Implementation

```tsx
// In TransactionTable.tsx, update renderRow:

const renderRow = (txn: Transaction, offsetY: number, index: number) => (
  <div
    key={txn.id}
    className={clsx(
      "absolute top-0 left-0 flex items-center border-b border-border",
      "hover:bg-surface-hover focus:outline-none focus-visible:ring-2",
      "focus-visible:ring-accent focus-visible:ring-offset-2",
      "focus-visible:ring-offset-background cursor-pointer transition-base",
      // Subtle zebra striping — 30% opacity surface-hover on odd rows
      index % 2 !== 0 && "bg-surface-hover/30",
      // Selected row gets stronger hover tint
      selectedTransaction?.id === txn.id && "bg-surface-hover",
    )}
    style={{
      transform: `translateY(${HEADER_HEIGHT + offsetY}px)`,
      width: `${tableWidth}px`,
      height: `${rowHeight}px`,
    }}
  >
```

- **No new CSS classes**: Uses existing `bg-surface-hover/30` (Tailwind opacity
  syntax with existing token).
- **Hover takes precedence**: Hover always applies `bg-surface-hover` (full
  opacity), overriding the zebra tint.
- **Selected takes precedence**: Selected rows get `bg-surface-hover` at full
  opacity.
- **30% opacity**: Barely perceptible on the dark surface, just enough for
  eye-tracking aid.

## Tradeoffs

- **Zebra vs. hover conflict**: When hovering an odd row, the zebra tint (30%)
  is overridden by hover (100% surface-hover). This is correct — hover state
  should be the dominant signal. The transition from 30% to 100% is smooth
  via `transition-base`.

- **Selected row conflict**: When a row is selected and also odd-indexed,
  the selected tint (100% surface-hover) overrides the zebra tint. Correct —
  selection is the most important state.

- **Skeleton rows**: Loading skeleton rows should not have zebra striping —
  it would look like noise. The current skeleton implementation uses
  `skeleton h-2.5` placeholders without row backgrounds, so this is already
  correct.

## Notes

- This decision is the visual foundation — the status badge enhancement and
  coin column design build on top of this row structure.
- The 30% opacity on `bg-surface-hover` aligns with the "Anti-Liquid Glass"
  principle of "opacity: 70–85% for elevated panels, not 50% or transparent."
  Here we're going lighter (30%) because we're on a dark surface and the
  difference needs to be subtle.
- Referenced in: `docs/table-and-website-visual-enhancement/intro.md`
