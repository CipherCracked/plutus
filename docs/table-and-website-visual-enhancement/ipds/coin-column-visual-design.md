# Coin Column Visual Design

## Problem to solve

The current coins column renders as centered gold text:

```tsx
render: (txn) => (
  <span
    className={txn.coins_earned > 0 ? "text-accent" : "text-text-secondary"}
  >
    {txn.coins_earned > 0 ? `+${txn.coins_earned}` : "—"}
  </span>
)
```

While the gold color (#d4af37) correctly identifies the "coins = rewards"
domain context, the column is just plain text — no icon, no visual shape,
no reinforcement that this is a *reward* (not a cost).

Per the fintech-ui-2026 skill: "The single unique element this page will be
remembered by." The coin column is the opportunity for a signature element
— a small visual marker that reinforces the Plutus brand identity as a
rewards-focused platform.

Per the problem tree: "How can the table's visual language reinforce the
'Plutus' brand identity while feeling premium?" The gold accent is the
brand color, and coins are the reward mechanism — this is the intersection
of brand and utility.

## Options

### Option 1: Keep bare text (current style)

Leave the column as gold `+N` / `—` text with no icon.

- **How it feels**: Functional but anonymous. The gold color draws the eye,
  but without a visual marker, it's just text.
- **When it works**: When screen real estate is extremely tight, or when
  the rewards concept is already fully understood elsewhere in the UI.
- **Research**: Baseline — no financial dashboard in 2026 omits some visual
  marker for rewards/points.

### Option 2: Add a coin icon emoji (💰 or ◉ or ⭕)

Prepend a small emoji or Unicode symbol before the `+N` text:

```tsx
render: (txn) => (
  <span className={txn.coins_earned > 0 ? "text-accent" : "text-text-secondary"}>
    {txn.coins_earned > 0 ? `💰 +${txn.coins_earned}` : "—"}
  </span>
)
```

- **How it feels**: The emoji adds a friendly "reward" signal. The gold
  color + emoji together convey "this is a monetary reward."
- **When it works**: When the target audience appreciates playful touches
  and the brand voice is approachable rather than austere.
- **Research**: Many consumer fintech apps (Revolut, Cash App) use emoji
  in transaction rows. However, emoji sizing and rendering varies across
  platforms.

### Option 3: Add a structured coin badge (svg + text in Badge component)

Use the existing `Badge` component with the `gold` variant to create a
structured pill: an SVG coin icon + the coin count:

```tsx
import { Badge } from "@/components/ui/Badge"

render: (txn) => (
  <Badge variant={txn.coins_earned > 0 ? "gold" : "default"}>
    {txn.coins_earned > 0 ? (
      <>
        <CoinIcon className="w-3 h-3 mr-1" />
        +{txn.coins_earned}
      </>
    ) : "—"}
  </Badge>
)
```

- **How it feels**: The gold badge with a coin icon creates a structured
  "reward marker" that stands out as a distinct UI element. The badge's
  `bg-accent/10` background gives the coin column its own visual container.
- **When it works**: When the rewards feature is a key product differentiator
  and deserves visual prominence.
- **Research**: Brex uses structured "reward points" badges in their
  transaction table — a colored pill with a points icon.

### Option 4: Inline SVG coin icon only (no text, hover tooltip)

Render just a small gold coin SVG icon in each row, with the count shown
via tooltip or in the detail view:

```tsx
render: (txn) => (
  <CoinIcon className={txn.coins_earned > 0 ? "text-accent" : "text-text-secondary"} />
)
```

- **How it feels**: Ultra-minimal. Only the icon carries the reward signal —
  the actual count is secondary and lives in the detail view.
- **When it works**: When horizontal space is extremely tight (mobile), or
  when the coin count is truly secondary to the transaction itself.
- **Research**: Some B2B finance tools use icon-only treatment for
  metadata-like fields.

## Reasoning

**Option 3 (structured coin badge with Badge component + SVG icon) is the
best choice.**

### Why the Badge + icon approach

1. **Signature element**: The gold Badge with a coin icon becomes the
   table's signature visual element — the thing users will remember about
   Plutus' table design. This directly answers the problem tree's
   "What is the single signature element?"

2. **Brand reinforcement**: The Badge uses `bg-accent/10` (gold at 10%
   opacity background) + `text-accent` (gold text). This makes the gold
   accent the most prominent visual element in the table without being
   overwhelming. It reinforces that "coins = rewards" is the core value
   proposition.

3. **Structured containment**: Like the status badges (see IPD:
   status-badge-design), the coin column gets structural containment —
   a pill shape with padding and a background tint. This gives it the
   same visual language as status indicators, creating consistency.

4. **Icon + text pattern**: The coin SVG icon + `+N` text is a proven
   pattern from Brex and Revolut. The icon communicates "reward" at a
   glance; the number communicates "how much."

5. **Uses existing Badge component**: The `gold` variant already exists
   in `Badge.tsx` with `bg-accent/10 text-accent`. No new CSS needed.

6. **Zero-coin rows**: When `coins_earned` is 0 or negative, we show a
   neutral `—` in a `default` Badge. This maintains the table's grid
   structure — every cell has the same visual shape.

### Why not emoji (Option 2)

Emoji rendering is platform-dependent. On some systems, 💰 renders as a
large emoji that breaks the monospace column width. SVG icons are
deterministic and can be sized precisely.

### Why not bare icon only (Option 4)

The coin count is meaningful — users need to see "I earned 23 coins"
immediately, not hunt for a tooltip. The table is the primary place
where users scan their transaction history; hiding the count defeats the
purpose.

### Why not bare text (Option 1)

The bare text is what makes the table "bland." Adding a structured
badge with an icon gives the table its signature personality without
adding decoration.

## Implementation

```tsx
// 1. Create a CoinIcon component (or add to an icons file)
// src/components/icons/CoinIcon.tsx

import { SVGProps } from "react"

export function CoinIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="5"
        className="stroke-current fill-accent"
      />
      <path
        d="M12 7v10"
        className="stroke-current"
      />
    </svg>
  )
}

// 2. Update the coins column renderer in TransactionTable.tsx:

import { Badge } from "@/components/ui/Badge"
import { CoinIcon } from "@/components/icons/CoinIcon"

{
  key: "coins_earned",
  label: "Coins",
  width: 60,
  smWidth: 140,
  align: "center",
  render: (txn) =>
    txn.coins_earned > 0 ? (
      <Badge variant="gold">
        <CoinIcon className="w-3 h-3 mr-1" />
        +{txn.coins_earned}
      </Badge>
    ) : (
      <Badge variant="default">
        <span className="text-text-secondary">—</span>
      </Badge>
    ),
},
```

- **No changes to Badge.tsx**: The `gold` and `default` variants already exist.
- **No changes to globals.css**: Uses existing CSS variables and Tailwind classes.
- **CoinIcon**: A simple SVG of a coin with horizontal strikethrough
  (representing currency). Sized at 3x3 (w-3 h-3) to match the Badge's
  `text-xs` line height.

## Tradeoffs

- **Horizontal space**: The Badge with icon + text takes more width than
  bare text. The column's `smWidth: 140` on desktop should accommodate
  `+9999` + icon. On mobile (`width: 60`), the `+N` could overflow —
  we may need to truncate or show icon-only on mobile.

- **Color consistency**: The gold Badge (`bg-accent/10 text-accent`) is
  visually consistent with the status badges (`bg-success/10 text-success`).
  This creates a design system where all "indicators" have the same
  structural treatment.

- **Zero-coin rows**: Showing `—` in a `default` Badge maintains the
  grid structure but adds visual noise to rows without rewards. An alternative
  is to show nothing (empty cell) for zero-coin transactions — this would make
  the gold badges more prominent by contrast.

## Notes

- The gold Badge becomes the table's signature element — the one visual
  detail users will remember about Plutus' transaction table.
- Per the fintech-ui-2026 skill: "Let the signature element be the one
  memorable thing, keep everything around it quiet and disciplined." The
  coin badges add visual interest, but the rest of the row styling (zebra
  striping, status badges) remains subtle.
- The coin icon should be a simple geometric shape — a circle with a
  horizontal line through the center, representing a coin/currency. This
  aligns with the "raw aesthetics" principle of wireframe logic brought
  into final UIs.
- Referenced in: `docs/table-and-website-visual-enhancement/intro.md`
