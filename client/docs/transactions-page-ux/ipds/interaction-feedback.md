## Problem to solve

The transactions page currently provides minimal visual feedback for interactions.
When a user hovers a row, selects a transaction, opens a dropdown, or applies a
filter, the change is subtle — often just a background color change. The empty
state uses a small "◻" symbol that's barely visible, and there's no confirmation
when a filter is applied (the result count updates, but that's passive).

The question is: what is the **minimum set of interaction states** the page must
communicate, and what micro-interactions will make the page "feel good" rather
than functional?

## Options

### Option 1: Subtle state changes — background hover, border accent, opacity

Keep the raw-aesthetics minimalism: hover changes row background by 5%, focus shows
a thin accent ring, selected row has a left border in gold, empty state uses a larger
"no transactions" text block. No transitions, no animations.

- *How it feels:* Calm, professional, control-panel-like. Every state change is
  deliberate and restrained. Matches the raw-aesthetics philosophy of "no decorative
  animation."
- *When it makes sense:* The user values density and speed over delight. The page
  should feel like a data terminal, not a consumer app.

### Option 2: Purposeful motion — transitions on all state changes, hover lift

Apply 150ms ease-out transitions to every state: row hover lifts the row shadow,
dropdown fade-in/out, filter application shows a brief counter animation (e.g.,
"1,234 → 892" count transition). The empty state shows a simple illustration.

- *How it feels:* Polished and responsive. The transitions provide spatial awareness
  — you can see what changed and why. But risks "decoration for decoration's sake"
  if not tied to a functional change.
- *When it makes sense:* The user wants the page to feel premium and considered, not
  just functional.

### Option 3: State indicators as data — badges, inline feedback, active filter pills

Every filter that's active shows as a small pill (e.g., "Shopping ⓧ") in a horizontal
list above the table. Hovering a row shows a quick "View details" hint. Empty state
says "No transactions match 'Electronics' + 'FAILED'" — echoing the user's actual
filter criteria rather than generic text.

- *How it feels:* Transparent and informative. The user always knows what's filtered
  and can undo any single filter with one click. The inline feedback makes the system
  feel reactive rather than passive.
- *When it makes sense:* The user needs to understand complex filter combinations and
  wants granular undo.

### Option 4: Hybrid — subtle transitions + active filter pills + contextual empty state

Combine the best of Options 1 and 3: subtle 150ms transitions on hover/focus/selection
(no decorative animations), active filters shown as removable pills above the table,
and an empty state that echoes the user's filter criteria with a "Clear filters" button
prominently in view.

- *How it feels:* Polished but restrained. Every interaction has purposeful feedback
  without being flashy. The pills make filter management discoverable and undoable.
- *When it makes sense:* Best of both worlds — the page feels considered and
  professional without being overwhelming.

## Reasoning

**Option 4 (hybrid) is the best choice** for this context.

The raw-aesthetics trend is about function-forward design, not about removing all
feedback. The `/fintech-ui-2026` skill distinguishes between "purposeful motion" (good)
and "decoration for decoration's sake" (bad). Subordinate transitions (150ms ease-out)
on hover and selection states are purposeful — they show the user what changed. They're
not decorative flourishes.

The active filter pills (Option 3) solve a real scannability problem: when a user has
set 5 filters and gets 0 results, they need to see exactly what's applied to understand
why. The current "CLEAR" button is destructive (clears everything) — pills give
granular undo without extra menu navigation.

The empty state echoing the user's filter criteria addresses the "barely visible ◻"
problem directly — instead of a mystifying symbol, the user sees "No transactions
match 'Electronics' + 'FAILED' status" and a clear "Clear filters" button.

Per the skill's decision guide: "Would a finance professional find this trustworthy
at a glance?" Yes — the pills, transitions, and contextual empty state all communicate
"the system understands what you're looking at."

## Tradeoffs

- **Option 1** (subtle only) is the most restrained but doesn't solve the empty-state
  visibility problem or the "what filters are active" question. The page will still
  "feel broken" because the user can't see their filter state.
- **Option 2** (motion everywhere) risks violating the raw-aesthetics principle of
  "no decorative animation." If transitions are applied without purpose (e.g.,
  transitioning a background color that doesn't convey meaning), it's decoration.
- **Option 3** (pills + context) adds visual elements (pills = new UI) but each pill
  serves a purpose (showing + undoing a single filter). This is acceptable under the
  "every element serves a purpose" rule.
- **Option 4** (hybrid) requires coordinating transitions on multiple components and
  styling the pills consistently with the raw-aesthetics theme. The motion budget
  needs to be disciplined (only on state changes, never on hover-only "glow").

## Notes

- The "purposeful motion" principle from /fintech-ui-2026: transitions should "explain
  a state change," not "decorate." Hover → row background change = explains selection.
  Filter pill appearing = explains filter application.
- The empty state should echo the user's filter criteria in plain language: "No
  transactions match your filters" → "No transactions match Food & Dining + $500+"
- Active filter pills should appear above the results count, below the filter bar.
  Each pill has an ⓧ remove button for granular undo.
- "Clear all" remains as a button — it's the nuclear reset option.
- Referenced in: `docs/transactions-page-ux/itds/dropdown-implementation.md`
