## Problem to solve

The Digital Alpha assignment lists accessibility touches (semantic markup,
keyboard support) as a nice-to-have. The current TransactionTable renders
virtual rows with `@tanstack/react-virtual`, where each row is `position:
absolute` with `transform: translateY()`. Rows are focusable (`tabIndex={0}`)
and Enter/Space opens the detail view, but there is no arrow-key navigation
between rows.

The Setproduct 2026 Data Table Guide says: "Keyboard navigation is the
backbone. Arrow keys move between cells, Home and End jump to row ends, Page
Up and Page Down move by viewport." This is aspirational — for our table, the
minimum viable keyboard nav is: **Up/Down arrows move between rows, Enter
opens detail, Home jumps to first row, End jumps to last row.**

The tricky part: virtualization means only ~15 rows are rendered at any time,
and their DOM positions are managed by `@tanstack/react-virtual`. Arrow-key
navigation must work across the full 10k-row logical space, not just the
rendered DOM.

## Options

### Option 1: Track "focusedIndex" in component state, scroll virtualizer to it

Add a `focusedRowIndex` state to `TransactionTable`. On `keydown` of Up/Down
on a row, update the index and call `rowVirtualizer.scrollToIndex()`. The
virtualizer renders the newly-focused row, and `focus()` is called on it once
it mounts. Home/End jump to index 0 and `transactions.length - 1`.

```tsx
const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

// In renderRow, the row that matches focusedIndex gets autoFocus
const handleKeyDown = (e: KeyboardEvent, index: number) => {
  switch(e.key) {
    case "ArrowDown": e.preventDefault(); setFocusedIndex(index + 1); break
    case "ArrowUp":   e.preventDefault(); setFocusedIndex(index - 1); break
    case "Home":      e.preventDefault(); setFocusedIndex(0); break
    case "End":       e.preventDefault(); setFocusedIndex(transactions.length - 1); break
    case "Enter":     setSelectedTransaction(txn); break
  }
}

useEffect(() => {
  if (focusedIndex !== null) {
    rowVirtualizer.scrollToIndex(focusedIndex, { align: "center" })
  }
}, [focusedIndex])
```

- *When it works:* When the dataset is large (10k rows) and you need
  keyboard navigation across the full set. The virtualizer handles rendering
  only the visible subset.
- *Cost:* ~50 lines of code in TransactionTable.tsx.

### Option 2: Roving tabindex (ARIA pattern)

Implement the ARIA roving-tabindex pattern: only the currently-focused row
has `tabIndex={0}`; all others have `tabIndex={-1}`. On arrow key, the
focused row's `tabIndex` becomes -1, the next row's becomes 0, and focus
moves via `.focus()`.

- *When it works:* With native HTML tables (semantic `<table>`, `<tr>`, `<td>`)
  where all rows are always in the DOM.
- *Problem:* Our virtualized rows are `position: absolute` and only ~15 are
  mounted at any time. Roving tabindex assumes all rows are in the DOM. When
  the user arrows past the rendered range, there's no element to focus.
- *Mitigation:* Combine with Option 1's `scrollToIndex` to render the next row
  before focusing it.

### Option 3: No keyboard navigation

Keep the current behavior: rows are focusable, Enter opens detail, but no
arrow-key movement. Tab moves between rows one at a time.

- *When it works:* When accessibility is not tested. But the assignment
  explicitly lists it as a nice-to-have, and the Setproduct guide treats it
  as "non-negotiable."

## Reasoning

**Option 1 (track focusedIndex + scrollTo)** is the best choice.

### Why track focusedIndex

The virtualization layer means we can't rely on DOM order for keyboard
navigation. The logical row index (0 to 9,959) is different from the DOM
position. By maintaining `focusedRowIndex` as state, we decouple keyboard
navigation from the rendered DOM — the virtualizer handles rendering the
correct row.

### Why not roving tabindex (Option 2)

Roving tabindex is the "proper" ARIA pattern, but it assumes all rows are
in the DOM. Our virtualized rows are constantly mounting/unmounting as the
user scrolls. When you arrow Down from row 100 (rendered) to row 101 (not yet
rendered), there's no element to focus. We'd need to combine it with
`scrollToIndex` anyway, at which point we're back to Option 1 plus the
complexity of managing `tabIndex` attributes across re-renders.

### Why not skip (Option 3)

Setproduct: "Keyboard navigation is the backbone." Finance professionals
expect spreadsheet-style arrow-key navigation. Without it, the table feels
broken to a keyboard user. The assignment evaluates "CSS and UI craft" at 30%,
and accessibility is part of that.

## Implementation

```tsx
// 1. Add state
const [focusedIndex, setFocusedIndex] = useState<number>(-1)

// 2. Row keydown handler
const handleRowKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, idx: number) => {
  const maxIndex = transactions.length - 1
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault()
      setFocusedIndex(Math.min(idx + 1, maxIndex))
      break
    case "ArrowUp":
      e.preventDefault()
      setFocusedIndex(Math.max(idx - 1, 0))
      break
    case "Home":
      e.preventDefault()
      setFocusedIndex(0)
      break
    case "End":
      e.preventDefault()
      setFocusedIndex(maxIndex)
      break
    case "Enter":
      // Already handled by onClick — no change needed
      break
  }
}

// 3. Scroll virtualizer to focused row
useEffect(() => {
  if (focusedIndex === -1) return
  rowVirtualizer.scrollToIndex(focusedIndex, { align: "center" })
}, [focusedIndex])

// 4. Focus the rendered row when it mounts
// In renderRow, add:
//   ref={focusedIndex === virtualRow.index ? (el) => el?.focus() : undefined}
```

### ARIA attributes

- `role="row"` on each row div
- `aria-selected={selectedTransaction?.id === txn.id}` on each row
- `aria-rowindex={virtualRow.index + 1}` for screen reader row position
- `aria-setsize={transactions.length}` and `aria-posinset={virtualRow.index + 1}`
  so the screen reader knows the total set size

## Notes

- The virtualizer's `getVirtualItems()` returns virtual rows with `.index`
  (the logical row index) and `.start` (the translateY offset). We use
  `.index` for keyboard navigation and `.start` for positioning.
- `scrollToIndex` may not find the element immediately (it's async in the
  virtualizer). A fallback `scrollBy` can nudge the scroll container.
- Home/End should also scroll the table body into view if it's not visible.
- Referenced in: `docs/table-performance-enhancement/ipds/table-accessibility-and-polish.md`
- Referenced in: `docs/table-performance-enhancement/intro.md`
