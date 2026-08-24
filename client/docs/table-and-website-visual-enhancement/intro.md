# Table and Website Visual Enhancement

## Problem Statement

The Plutus fintech dashboard implements Raw Aesthetics 2026 correctly (monospace fonts, sharp edges, dark-first palette, gold accent) but feels **bland and un-scannable**. The transactions table lacks visual hierarchy for financial data: status badges are bare colored text with no structure, rows have no meaningful differentiation, and there's no data encoding through color beyond binary status. The charts are basic with no data labels or reference lines. The design is functional but not "interesting" — it doesn't guide the eye or reinforce trust.

The gap is between "raw, schematic layouts" and "purposeful polish that makes financial data scannable." The raw-aesthetics skeleton is in place; we need the flesh of intentional visual hierarchy on top.

## Background and Context

### Current State

- **Theme**: `#0a0a0a` background, `#121212` surface, `#d4af37` gold accent, status colors (success/failed/pending)
- **Table**: 6 columns (Date, Merchant, Category, Amount, Coins, Status)
  - Status is rendered as bare uppercase monospace text with a `.status-*` CSS class (text color only, no background)
  - Coins is centered gold text with a `+N` / `—` format
  - Rows use flat `border-b` separators with `hover:bg-surface-hover`
  - Amount is right-aligned with `toLocaleString("en-IN")` currency formatting
  - Virtualization via `@tanstack/react-virtual` with 48px (desktop) / 40px (mobile) row heights

- **Charts**: Chart.js Bar and Line with gold (#d4af37) accent line, `barColors` array per category, monospaced config
  - No data labels on bars
  - No reference lines or annotations
  - No click-to-filter interaction

### Research Findings

**Fintech Dashboard Design 2026** (adminlte.io):

| Platform | Key Insight |
|---|---|
| Stripe | Tabular figures, right alignment, state-only color — color carries meaning, not decoration |
| Mercury | Editorial calm — clean white space, consistent typography, no visual noise |
| Revolut | Dark cinematic — deep blacks with gold/silver accents for financial data |
| Brex | Exception-first — failed transactions get visual emphasis, not just red text |
| Wise | Fee transparency — inline fee breakdown within transaction rows |

**Financial Table Design Principles**:
1. "Color means state, nothing else" — color encodes status/magnitude, not decoration
2. "Tabular figures, right alignment, currency formatting" — all numbers in `tabular-nums` font variant, currency right-aligned
3. "Calm is credibility" — financial UIs should reduce cognitive load, not create visual excitement
4. Status badges should have structure (background tint + colored text) not just text color

### Raw Aesthetics Implementation Status

| Element | Implemented | Needs Enhancement |
|---|---|---|
| Monospace fonts for data | ✅ | None |
| Sharp edges (border-radius 0) | ✅ | None |
| Dark-first palette (#0a0a0a) | ✅ | None |
| Gold accent for coins | ✅ | Add coin icon |
| Status text color | ✅ | Add badge structure |
| Grid-based layout | ✅ | Add row differentiation |

## Goals

1. Add **visual depth to rows** — subtle differentiation between odd/even or by category, beyond flat monochrome
2. Transform **status from bare text to structured badges** — using the existing `Badge` component variants (success/failed/pending)
3. Add **data-encoding color** — use muted background tints by category or amount magnitude to aid scanning
4. Make **coins column more visual** — add a small coin icon or sparkline for +N vs —
5. Add **chart polish** — data labels, click-to-filter, reference lines
6. Keep the entire enhancement within the **Raw Aesthetics 2026** design language — no decoration, no rounded corners, no glassmorphism

## Non-Goals

- Don't change the core architecture (Zustand store, virtualization, server-side filtering)
- Don't change the dark-first palette or gold accent
- Don't add decorative flourishes or animations that don't serve scanability
- Don't change the mobile overlay pattern or bottom navigation
- Don't add new columns to the table

## Constraints

1. Must remain compatible with `@tanstack/react-virtual` for 10k-row virtualization
2. Must use existing `Badge` component variants (success, failed, pending, gold)
3. Must respect `prefers-reduced-motion` — no motion without `transition-base`
4. Must maintain keyboard navigation (currently implemented with roving tabindex via `focusedIndex`)
5. Must maintain the frozen first column pattern (sticky `bg-surface z-10`)
6. Status text must remain `uppercase` and `font-mono` per financial conventions

## Assumptions

- The 10k-row dataset is already loaded client-side (per ITD decision on in-memory caching)
- Users spend 80% of their time in the transactions table, scanning for anomalies
- Users care most about status (failed/pending) and amount magnitude
- The gold accent (#d4af37) is correctly chosen for the "coins = rewards" domain context

## Problem Tree

```text
Table and Website Visual Enhancement
├── What visual hierarchy makes financial table data scannable without adding decoration?
│   ├── How should rows be differentiated to aid scanning?
│   └── How should column headers carry visual weight without decoration?
├── How should status badges convey meaning with the gold accent + raw aesthetics constraint?
│   └── Should we use the existing Badge component or inline badge markup?
├── What data-encoding color patterns improve scanability without breaking "color means state"?
│   ├── Should category have a subtle background tint?
│   └── Should amount magnitude be encoded as a data bar or color?
├── How can the table's visual language reinforce the "Plutus" brand identity while feeling premium?
│   └── Is the coin icon + gold accent the single signature element?
└── What is the single signature element that makes the table memorable?
    └── Is it the status badge redesign, the row depth, or the coin visualization?
```

## Open Questions

1. Should the status badge use background tint (`bg-success/10`) or a solid color panel?
2. Should odd rows get a subtle `bg-surface-hover` tint, or should differentiation come from category coloring?
3. Should the coins column add an inline SVG icon, or is the gold `+N`/`—` text sufficient?
4. Should amount cells show a micro-sparkline for transaction history, or just currency formatting?
5. Should charts support click-to-filter, and how does that interact with the FilterBar Zustand state?
