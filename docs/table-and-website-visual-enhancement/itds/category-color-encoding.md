## Problem to solve

Stripe's pattern says: "Color means state, nothing else." This means we should
not use color for decoration, but we CAN use color to encode data — as long as
the color mapping is intentional and consistent.

The question is: what is the most useful color encoding for this table, and
how do we implement it without overwhelming the Raw Aesthetics design?

Currently, the table has NO data-encoding color beyond the three status
colors (success/failed/pending). Per the IPD table-row-visual-hierarchy, we
are adding zebra striping (subtle bg-surface-hover/30) for row tracking — but
that's not data encoding, it's structural aid.

The AnalyticsView already has a `barColors` array (8 colors cycling through
categories), and the chart dims bars when a non-category filter is active.
We need a consistent approach for the table.

Options:

### Option 1: No additional data-encoding color (pure neutral)

Keep the table monochrome beyond status badges and gold coin badges. Rows
differ only by zebra striping, status badge color, and coin badge gold.

- **How it feels**: Maximum calm. Every color element carries meaning.
- **When it works**: When users primarily scan by status and amount, not
  category. The "Category" column is text-only, read left-to-right.
- **Source**: Stripe — strictly "color means state, nothing else."

### Option 2: Category-based row tint (very subtle, 5% opacity)

Map each transaction category to a color from the existing `barColors` array.
Apply at 5% opacity as a left-border accent or very light row background.

```tsx
const categoryColors: Record<string, string> = {
  "Food & Dining": "#22c55e",   // green
  "Transport": "#3b82f6",       // blue
  "Shopping": "#ec4899",        // pink
  "Entertainment": "#a855f7",   // purple
  "Bills & Utilities": "#f59e0b", // amber
  "Healthcare": "#ef4444",      // red
  // ... etc
}

// In renderRow:
const catColor = categoryColors[txn.category]
clsx(
  catColor && `border-l-2 border-${...}`,
  index % 2 !== 0 && "bg-surface-hover/30",
)
```

- **How it feels**: Very subtle color accents help the eye group transactions
  by category. At 5% opacity, the tints are barely perceptible but create
  a sense of color harmony across the table.
- **When it works**: When users frequently filter by category and benefit
  from visual grouping during unfiltered scans.
- **Source**: YNAB and Monarch use category color coding, but in "dot"
  or "pill" format, not row-level background.

### Option 3: Category dot in the Category column

Instead of row-level tinting, add a small colored dot (4x4) before the
category name in the Category column cell:

```tsx
render: (txn) => {
  const color = categoryColors[txn.category]
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {txn.category}
    </div>
  )
}
```

- **How it feels**: Each category gets a consistent color dot — a common
  pattern in data tables. Users can learn the color mapping over time.
- **When it works**: When there are ≤8 categories (matching our `barColors`
  array length) and users benefit from quick category recognition.
- **Source**: Notion, Linear, and most modern data tables use colored dots
  for category/status identification.

### Option 4: Amount-based color (data bar or color gradient)

Encode the amount magnitude as color intensity or a micro data-bar within
the amount cell:

```tsx
render: (txn) => {
  const maxAmount = Math.max(...transactions.map(t => t.amount))
  const intensity = Math.min(txn.amount / maxAmount, 1)
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 bg-accent/30"
        style={{ width: `${intensity * 40}px` }}
      />
      {formatCurrency(txn.amount)}
    </div>
  )
}
```

- **How it feels**: Larger transactions get longer "data bars" — a visual
  encoding of magnitude alongside the numeric value.
- **When it works**: When amount magnitude is the primary scanning criterion
  and users want to spot outliers visually.
- **Source**: Excel conditional formatting, financial dashboards.

## Reasoning

**Option 3 (category dot in the Category column) is the best choice.**

### Why category dots

1. **Consistent with AnalyticsView**: The `barColors` array already exists
   and is used for the chart. Using the same colors for table category dots
   creates a visual link between the chart and the table — clicking a chart
   bar and seeing the same color dot in the table reinforces the connection.

2. **Minimal visual noise**: A 4x4 dot takes 8px of horizontal space. It's
   an accent, not a structural element. Per the fintech-ui-2026 skill:
   "Decoration → Intent" — the dot encodes real data (category identity),
   not decoration.

3. **Dark-mode-friendly**: At full opacity (#22c55e, #3b82f6, etc.), the
   dots are visible against the dark surface. They don't compete with the
   gold accent (reserved for coins) or the status colors (reserved for
   state). Each color channel has a distinct purpose:
   - Gold = reward action (coins)
   - Green/red/amber = transaction state (status)
   - Other colors = category identity

4. **Scalable**: The `barColors` array has 8 colors, enough for the 7
   common spending categories. If more are added, the array cycles.

5. **Screen-reader friendly**: The dot is purely visual (no semantic meaning
   for screen readers) — the category text carries the information. We can
   add `aria-hidden` to the dot.

### Why not row-level tint (Option 2)

At 5% opacity, the category tint is essentially invisible on the dark
background. At 10%+, it starts competing with the zebra striping and
status badges. Row-level tinting also conflicts with the Stripe principle
"color means state, nothing else" — we'd be using color for category
identification, which could be confused with status color.

### Why not amount-based bars (Option 4)

Amount magnitude is already encoded in the numeric value itself. Adding
a data bar introduces visual noise and competes with the currency
formatting. Users in a finance context trust numbers — they don't need
a visual proxy for magnitude. This also conflicts with "Calm is
credibility" from the fintech-ui-2026 skill.

### Why not pure neutral (Option 1)

With only zebra striping + status badges + coin badges, the table has
no data-encoding color for category. Users scanning 50 rows must read
the "Category" column text for every row. Category dots allow pre-attentive
scanning (the eye recognizes colors before reading text).

## Implementation

```tsx
// 1. Define category color mapping (in TransactionTable.tsx or a
//    separate constants file)

const categoryColorMap: Record<string, string> = {
  "Food & Dining": "#22c55e",    // green
  "Transport": "#3b82f6",        // blue
  "Shopping": "#ec4899",         // pink
  "Entertainment": "#a855f7",    // purple
  "Bills & Utilities": "#f59e0b", // amber
  "Healthcare": "#ef4444",       // red
  "Travel": "#06b6d4",           // cyan
  "Other": "#84cc16",            // lime
}

// 2. Add colorDot render to the Category column

{
  key: "category",
  label: "Category",
  width: 90,
  smWidth: 240,
  render: (txn) => (
    <div className="flex items-center gap-2">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: categoryColorMap[txn.category] || "#9a9a9a" }}
        aria-hidden="true"
      />
      {txn.category || "Uncategorized"}
    </div>
  ),
},
```

- **No changes to theme.ts**: Uses inline `style={{ backgroundColor }}`
  for the dots. This is acceptable because the colors come from the existing
  `barColors` array used in AnalyticsView — they're already "owned" by
  the data layer, not the design system.

- **No changes to globals.css**: No new CSS classes needed.

- **Fallback color**: If a category isn't in the map, use `#9a9a9a`
  (text-secondary) — a neutral gray dot.

- **Accessibility**: `aria-hidden="true"` on the dot, since the category
  text carries the semantic information. The dot is a visual enhancement
  only.

- **Consistency with AnalyticsView**: The same `categoryColorMap` (or the
  `barColors` array) should be used in both the chart and the table so
  that clicking a chart bar and seeing the table reinforces the color
  mapping.

## Tradeoffs

- **Color blindness**: Users with red-green color blindness may confuse
  the green (Food) and red (Healthcare) dots. However, the category text
  is always present, and the dots are supplemental. This is the same
  tradeoff every data-table color scheme makes.

- **Category changes**: If new categories are added to the backend, the
  client-side map needs updating. The fallback `#9a9a9a` dot prevents
  visual breakage for unknown categories.

- **Dot size**: 4x4 (h-2 w-2) at full opacity is visible but not dominant.
  The `rounded-full` makes it a circle — a common shape for category
  markers. It doesn't conflict with the `sharp-sm` border-radius of badges
  because dots are intentionally circular (representing a "dot" of
  identity, not a structured badge).

## Notes

- The category dots create a subtle visual link between the AnalyticsView
  chart (where each category bar uses a color from `barColors`) and the
  TransactionTable (where each row's category dot uses the same color).
  This cross-component consistency helps users understand "this bar in the
  chart represents these rows in the table."
- Per the fintech-ui-2026 skill: "Structure is information." The colored dot
  encodes the category relationship — it's a data point, not decoration.
- Referenced in: `docs/table-and-website-visual-enhancement/intro.md`
