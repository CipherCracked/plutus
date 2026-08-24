| ITD 3 - "Shrink table columns at the sm breakpoint (640px) and enable horizontal scroll with a frozen first column." |  |
| :---- | :---- |
| **The Problem** | The transaction table has 6 columns totaling 900px width (Date 140 + Merchant 260 + Category 140 + Amount 120 + Coins 100 + Status 140). On a 360px viewport, this overflows by 540px. The current `overflow-x-hidden` clips content, making the merchant name, category, and status unreadable. The IPD decision is horizontal scroll with a frozen first column, but the question is: what column widths to use at 360px, how to implement the frozen column with the virtualized row layout, and how to maintain scroll synchronization between the table header and the virtual rows? | **Options Considered (Decision in bold)** |
| **Option 1** | **Responsive column widths via Tailwind breakpoint prefixes.** Define column widths in the `COLUMNS` array with a base width (mobile) and a `sm` override (desktop). The COLUMNS array becomes `[{ ..., width: 90, smWidth: 140 }, ...]`. The header and rows render with `sm:w-[140px]` classes via conditional `clsx` or `style` based on a `useMediaQuery` hook. The table container gets `overflow-x-auto` and the first column gets `sticky left-0`. The header and virtual rows share the same scroll parent. |
| **Option 2** | Use CSS container queries to detect the table's container width and adjust column widths automatically. No breakpoint-based classes needed. |
| **Option 3** | Hide non-critical columns (Category, Coins, Status) entirely at 360px, showing only Date, Merchant, and Amount. No horizontal scroll needed. Detail panel shows hidden fields on tap. |
| **Option 4** | Transform the table into cards on mobile — each row becomes a card with stacked key-value pairs. Eliminates horizontal scroll but sacrifices column alignment. |
| **Reasoning** | **Option 1 (responsive column widths with Tailwind breakpoints)** is the best choice. The IPD for mobile-table-layout explicitly chose horizontal scroll with frozen first column because the core task is cross-record comparison. The column width changes must be declarative and based on the `sm:` breakpoint (640px) which is Tailwind's standard responsive threshold. |
| | **Why not container queries** (Option 2): Tailwind CSS v4 does support container queries, but the table's scroll container is `overflow-x-auto` — a container query on a horizontally-scrolling element doesn't behave intuitively (the container width is 360px, not the table's 600px). CSS media queries (Tailwind's `sm:` prefix) are the correct tool for viewport-based breakpoints, and they're already the project's convention. |
| | **Why not hide columns** (Option 3): The IPD explicitly rejected this — hiding columns breaks the sort-by comparison flow. If the Status column is hidden, the user can't sort by status and scan results. |
| | **Why not cards** (Option 4): The IPD explicitly rejected card transformation for 10,000-row datasets. |
| **Column widths at breakpoints** | |
| | Based on the Setproduct 2026 guide recommendation: "Fix the width of predictable columns like status, dates, and the actions cell. Let text-heavy columns flex to fill." Our columns: |
| | | Column | Mobile (360px) | Desktop (sm+) |
| | | :--- | :--- | :--- |
| | | Date | 90px | 140px |
| | | Merchant | 120px | 260px |
| | | Category | 90px | 140px |
| | | Amount | 80px | 120px |
| | | Coins | 60px | 100px |
| | | Status | 80px | 140px |
| | | **Total** | **520px** | **900px** |
| | | At 360px, the 520px table overflows by 160px — a 1.4x horizontal scroll ratio. Acceptable for finance data comparison. |
| **Implementation** | |
| | The `COLUMNS` array gains a `smWidth` property. The `TableHeaderCell` and `renderRow` functions use `useMediaQuery` (or CSS breakpoint detection) to determine the active width. Simpler approach: render both widths via Tailwind classes and let `sm:` prefix handle the switch: |
| | ```tsx | |
| | const COLUMN_WIDTHS = { | |
| |   timestamp: { base: 90, sm: 140 }, | |
| |   merchant: { base: 120, sm: 260 }, | |
| |   category: { base: 90, sm: 140 }, | |
| |   amount: { base: 80, sm: 120 }, | |
| |   coins_earned: { base: 60, sm: 100 }, | |
| |   status: { base: 80, sm: 140 }, | |
| | } | |
| | ``` | |
| | The column widths are applied via inline `style={{ width: width, flexShrink: 0 }}` on each cell. The `sm:` width can be applied via a CSS class on the parent container that changes the inline style — since inline styles beat CSS, we use a small `useMediaQuery` hook that sets a `isDesktop` boolean and switches the width value. |
| | **Frozen first column**: The Date column gets `position: sticky; left: 0; background: var(--color-surface); z-index: 10;` applied to both the header cell and each virtual row's first cell. Since virtual rows are `position: absolute`, we need to make the sticky work inside the absolute-positioned row — this means the first cell inside each row gets `position: sticky` relative to the row's containing block. |
| | **Scroll synchronization**: The header and rows are both inside the same `overflow-x-auto` parent — the `div ref={parentRef}` that already exists as the vertical scroll container. We wrap it in an outer `div.overflow-x-auto` so horizontal scroll applies to both header and body. |
| **Tradeoffs** | |
| | - The frozen column with virtual rows is tricky: `@tanstack/react-virtual`'s rows are `position: absolute` with `transform: translateY()`. A `position: sticky` child inside an `absolute` parent doesn't behave as expected — the sticky context is the containing block, not the viewport. Solution: wrap the sticky cell's parent in a `position: relative` container, or use `transform` on the row instead. |
| | - The inline `style` for width means we can't use Tailwind's `sm:w-[140px]` directly — we need a JS breakpoint check. The `useMediaQuery('(min-width: 640px)')` hook adds ~10 lines but is clean. |
| | - Horizontal scroll + vertical virtual scroll creates a dual-scroll situation. On mobile, users scroll vertically for rows and horizontally for columns — this is the standard spreadsheet mobile pattern. |
| | - Row height at 360px: can shrink from 48px to 40px (`ROW_HEIGHT_MOBILE = 40`) to fit more rows. The estimate must switch based on breakpoint. |
| **Notes** | |
| | - Hook: `useMediaQuery(query: string): boolean` — returns `window.matchMedia(query).matches`, updates on resize. File: `src/hooks/useMediaQuery.ts`. |
| | - The `overflow-x-auto` wrapper must be on the parent of both the sticky header and the scrollable body — not on `document.body` or the page container. |
| | - The frozen column's background must be `var(--color-surface)` (not transparent) so it covers scrolled columns underneath. |
| | - Row height: `const ROW_HEIGHT = useMediaQuery('(min-width: 640px)') ? 48 : 40`. |
| | - Header height stays at 44px on mobile — just add vertical padding to make sort buttons 44px touch targets (see mobile-touch-targets.md). |
| | - Referenced in: `docs/mobile-responsiveness/ipds/mobile-table-layout.md` |
| | - Referenced in: `docs/mobile-responsiveness/ipds/mobile-filter-strategy.md` |
| | - Referenced in: `docs/mobile-responsiveness/ipds/mobile-header-and-detail.md` |
| | - Referenced in: `docs/transactions-page-ux/itds/dropdown-implementation.md` |
