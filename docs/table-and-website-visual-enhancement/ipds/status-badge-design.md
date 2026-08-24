# Status Badge Design

## Problem to solve

The current transaction table renders status as bare uppercase monospace text:

```tsx
<span className={clsx(
  "text-xs font-medium uppercase",
  txn.status === "SUCCESS" && "status-success",
  txn.status === "FAILED" && "status-failed",
  txn.status === "PENDING" && "status-pending",
)}>
  {txn.status}
</span>
```

The `.status-success` / `.status-failed` / `.status-pending` CSS classes apply
**text color only** — no background, no padding, no structural containment. The
status text (e.g., "SUCCESS") is rendered inline at the same visual weight as
all other cell content. There's no visual structure that distinguishes a
status indicator from a data value.

Per the fintech-ui-2026 skill: "Brex (exception-first) — failed transactions
get visual emphasis, not just red text." The current implementation fails this
principle: a FAILED transaction is just red text on a flat surface — it doesn't
"pop" visually as an exception that needs attention.

A structured badge with a light background tint + colored text (as the existing
`Badge` component already provides with `bg-success/10 text-success`) gives
status indicators the structural containment they need to be scannable at a
glance.

## Options

### Option 1: Keep bare colored text (current style)

Leave the status column as-is: uppercase monospace text with text-only color
classes. No background, no padding, no pill shape.

- **How it feels**: Status is just another text value — users have to
  read each row's status rather than scanning for color blocks.
- **When it works**: When the table is so wide that every pixel of horizontal
  space is precious, and status is secondary to other data.
- **Research**: None — this is the baseline we're improving upon.

### Option 2: Use the existing Badge component with variants

Replace the bare `<span>` with the `Badge` component from `@/components/ui/Badge`:

```tsx
import { Badge } from "@/components/ui/Badge"

<Badge variant={
  txn.status === "SUCCESS" ? "success" :
  txn.status === "FAILED" ? "failed" :
  txn.status === "pending" ? "pending" : "default"
}>
  {txn.status}
</Badge>
```

The `Badge` component renders:

```tsx
<span className={clsx(
  "sharp-sm inline-flex items-center px-2 py-0.5 text-xs font-mono",
  variantClasses[variant],  // bg-success/10 text-success, etc.
  className,
)}>
  {children}
</span>
```

- **How it feels**: Status has structural containment — a pill-shaped background
  tint at 10% opacity, with colored text. FAILED status has a subtle red
  background that catches the eye without overwhelming. Aligns with Brex's
  "exception-first" pattern.
- **When it works**: Always — the Badge component is already built, tested, and
  used elsewhere in the codebase. It's designed for exactly this use case.
- **Research**: Fintech UI 2026 — "Anti-Liquid Glass: controlling opacity for
  functional depth." The `bg-success/10` (10% opacity) is subtle enough to not
  compete with the gold accent, but provides enough visual weight to distinguish
  status from data.

### Option 3: Custom inline badge markup (not using Badge component)

Write a new inline span with custom classes:

```tsx
<span className={clsx(
  "sharp-sm inline-flex items-center px-2 py-0.5 text-xs font-mono",
  "bg-success/10 text-success",  // replicated from Badge
)}>
  {txn.status}
</span>
```

- **How it feels**: Identical to Option 2 visually, but duplicates the Badge
  component's implementation.
- **When it works**: Never — always prefer the shared component.
- **Research**: Violates "Single Responsibility" from CLAUDE.md — each artifact
  should have one clear responsibility. The Badge component already owns badge
  styling.

## Reasoning

**Option 2 (use the existing Badge component) is the best choice.**

### Why use the Badge component

1. **Already implemented**: The `Badge` component exists in
   `src/components/ui/Badge.tsx` with the exact variants needed
   (success, failed, pending). It was designed for this purpose.

2. **Visual containment**: The `bg-success/10` background tint + colored text
   pattern gives status indicators the structural containment they need. Per
   the Fintech UI 2026 skill, this aligns with "Brex (exception-first) — failed
   transactions get visual emphasis, not just red text."

3. **Subtle opacity**: The 10% background tint is subtle enough to not compete
   with the gold accent (which is reserved for coins/rewards actions). It
   provides just enough visual weight to distinguish status from raw data.

4. **Sharp edges**: The existing Badge uses `sharp-sm` (2px border radius)
   which maintains the Raw Aesthetics design language. No rounded corners.

5. **Monospace font**: The Badge uses `font-mono` which preserves the
   financial convention of uppercase status labels in monospaced type.

6. **Consistent with codebase**: The Badge component is already used in the
   codebase — using it here maintains design system consistency.

### Why not keep bare text (Option 1)

Bare colored text fails the "exception-first" principle from the fintech research.
A FAILED transaction should have a subtle visual block behind it that catches
the eye when scanning. Bare text requires the user to read every status rather
than scanning for color blocks.

### Why not custom inline (Option 3)

This would duplicate the Badge component's implementation, violating the
Single Responsibility principle from CLAUDE.md. The Badge component is the
canonical home for badge styling.

## Tradeoffs

- **Screen real estate**: A structured badge (`px-2 py-0.5`) takes slightly
  more horizontal space than bare text. With 6 columns in the desktop table,
  the status column's `smWidth: 220` vs `width: 80` on mobile provides enough
  room. The badge fits within the current column constraints.

- **Text alignment**: The Badge uses `inline-flex items-center` which centers
  content within the badge. With `text-center` alignment on the column wrapper,
  the badge will be centered — which looks correct for status pills.

- **Theme compatibility**: The Badge component uses `bg-success/10` which is
  relative to the success token (`#22c55e`). In light mode, this would be
  `bg-success/10` on a light background — still readable.

## Implementation

```tsx
// In TransactionTable.tsx, update the status column renderer:

import { Badge } from "@/components/ui/Badge"

// In the COLUMNS array:
{
  key: "status",
  label: "Status",
  width: 80,
  smWidth: 220,
  align: "center",
  render: (txn) => {
    const variant =
      txn.status === "SUCCESS" ? "success" :
      txn.status === "FAILED" ? "failed" :
      txn.status === "PENDING" ? "pending" : "default"
    return (
      <Badge variant={variant}>
        {txn.status}
      </Badge>
    )
  },
},
```

- **No changes to Badge.tsx**: The component already has the needed variants.
- **No changes to globals.css**: The status CSS classes remain available for
  other uses.
- **No changes to theme.ts**: The status colors are already defined.

## Notes

- The Badge component's `variantClasses` uses `bg-success/10 text-success`
  pattern (light background tint with colored text). This is the correct
  visual treatment for financial status badges — subtle enough to not
  compete with the gold accent, but structured enough to be scannable.
- Referenced in: `docs/table-and-website-visual-enhancement/intro.md`
