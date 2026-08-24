| ITD 2 - "Implement filter and detail overlays using position:fixed full-screen containers with createPortal, Escape backdrop, and sticky action buttons." |  |
| :---- | :---- |
| **The Problem** | The mobile filter strategy (full-screen overlay) and header/detail adaptation (full-screen detail overlay) both require the same technical pattern: a `position: fixed` container rendered via `createPortal` to `document.body`, with a scrim backdrop, Escape/backdrop-dismiss, and proper z-index management. The filter overlay must contain all 8 filter controls in a scrollable form with sticky Apply/Clear buttons. The detail overlay must render the full TransactionDetail content with a close button. Both overlays must coexist without z-index conflicts and must not break the existing desktop experience. The question is: how to implement these overlays in a way that is reusable, accessible, and consistent with the raw-aesthetics visual language? | **Options Considered (Decision in bold)** |
| **Option 1** | **Create a reusable `Overlay` component using `createPortal`, `position: fixed`, `inset: 0`, Escape handling, and click-away.** The component renders an optional scrim, a close button in the top-right, and content in a scrollable body. The filter overlay passes all 8 controls as children with a sticky footer for Apply/Clear. The detail overlay passes TransactionDetail content as children. Uses `useEffect` for Escape/backdrop-dismiss and `useRef` for click-away detection. |
| **Option 2** | Duplicate the portal logic in both `FilterBar` and `TransactionDetail`. Each component has its own `createPortal` call, its own Escape handler, its own scrim. More code but simpler per-component logic. |
| **Option 3** | Use a Tailwind plugin or CSS-only modal (using `:target` or checkbox hack). Avoids JS entirely but limits dismissal to URL fragment changes and checkbox state. |
| **Option 4** | Use a headless UI library component (HeadlessUI, Radix Dialog) that provides overlay primitives out of the box. |
| **Reasoning** | **Option 1 (reusable Overlay component)** is the best choice. Both the filter drawer and the detail view need the same overlay behavior — portal rendering, backdrop, Escape dismiss, close button, z-index stacking. Building one reusable component avoids duplicating ~40 lines of portal + event-listener code across two components. |
| | **Why not duplicate** (Option 2): The raw-aesthetics principle is "no decoration for decoration's sake" and "every element serves a purpose." Duplicating the same portal + event handler logic in two places is maintenance debt — if the dismissal behavior changes, both need updating. A shared component is DRY without being clever. |
| | **Why not CSS-only** (Option 3): CSS `:target`-based modals require URL changes, which pollutes the browser history. The checkbox hack doesn't work with React's controlled re-rendering and breaks the back button. The pencil-and-paper article emphasizes that "users might expect to use normal navigation elements (Back button) to move away" — a CSS-only approach can't support that reliably. |
| | **Why not headless library** (Option 4): The project constraint (from `transactions-page-ux` ITD 1) is "build a small internal component system" — adding a library dependency for overlay behavior is over-engineering for two use cases. The portal + ref pattern is ~60 lines of code and fully transparent. |
| **Component design** | |
| | The `Overlay` component: `<Overlay isOpen={bool} onClose={fn} title={string} className={string}>children</Overlay>` |
| | - Renders via `createPortal(children, document.body)` when `isOpen`. |
| | - Backdrop: a `fixed inset-0 bg-black/60` scrim (70% opacity per anti-liquid-glass guideline). Click backdrop → `onClose`. |
| | - Content: `fixed inset-0 z-[100] flex flex-col bg-surface overflow-y-auto`. |
| | - Header: `sharp-sm border-b border-border p-3 flex items-center justify-between` with a title (font-mono, small caps) and an ⓧ close button (min-h-11 min-w-11). |
| | - Body: `flex-1 overflow-y-auto p-3` — scrollable content area. |
| | - Sticky footer: for the filter overlay, a `sharp-sm border-t border-border p-3 flex gap-2 justify-end` container with Apply and Clear buttons. |
| | - Escape handling: `useEffect` on `keydown` for `Escape` → `onClose`. Cleanup on unmount. |
| | - `onClose` is called by: backdrop tap, Escape key, close button tap. |
| **Z-index strategy** | |
| | - Dropdown portals (from ITD 1): `z-[9999]` — highest, since they need to appear above everything including overlays. |
| | - Filter overlay: `z-[100]` — above table content but below dropdowns. |
| | - Detail overlay: `z-[100]` — same layer as filter overlay. Only one overlay is open at a time (can't open detail while filter is open), so no conflict. |
| | - Table sticky header: `z-10` — below overlays. |
| | - Virtual rows: default z-auto in normal flow. |
| **Filter overlay specifics** | |
| | - Opens when user taps the summary bar "FILTER" button or an active filter pill. |
| | - Contains all 8 controls grouped into the same 3 sections (Search, Filter, Range) as defined in IPD 1. |
| | - Controls use the same compact vertical layout as the mobile stacked groups (no grid). |
| | - Each group has a section header label (font-mono, xs, uppercase). |
| | - Apply button at bottom-right of sticky footer — triggers `setFilters` (already in the store) and closes overlay. |
| | - Clear All button at bottom-left of sticky footer — calls `clearFilters` + closes overlay. |
| | - Overlay uses `overflow-y-auto` so controls don't get cut off on very short screens. |
| **Detail overlay specifics** | |
| | - Opens when user taps a transaction row. |
| | - Renders `<TransactionDetail transaction={txn} onClose={onClose} />` as children. |
| | - The existing TransactionDetail component's `onClose` handler already exists — we just pass it through. |
| | - Close button (ⓧ) in overlay header replaces the current slide-over's close mechanism. |
| | - Body scrolls behind the overlay (overlay is `position: fixed` so page doesn't scroll). |
| **Tradeoffs** | |
| | - The reusable `Overlay` component is slightly more abstract than inline portals — but it's still one file, one component, no generic typing complexity. |
| | - `position: fixed` means `document.body` scroll position is locked while overlay is open — we should add `overflow-hidden` to body when overlay is open to prevent scroll bleed. |
| | - The scrim at 70% opacity (rgba(0,0,0,0.6)) matches the anti-liquid-glass guideline. |
| | - Escape closes the topmost overlay — since only one overlay is open at a time, this is straightforward. |
| | - The sticky footer (Apply/Clear) requires the overlay content to be in a separate scrollable element from the footer — achieved with `flex flex-col flex-1 overflow-y-auto` on body + fixed footer. |
| **Notes** | |
| | - File: `src/components/ui/Overlay.tsx` |
| | - The filter summary bar (shown when overlay is closed) replaces the current always-visible filter bar on mobile (`sm:hidden`). |
| | - On desktop (`sm:`), the full filter bar remains visible — overlay is never used. |
| | - Referenced in: `docs/mobile-responsiveness/ipds/mobile-filter-strategy.md` |
| | - Referenced in: `docs/mobile-responsiveness/ipds/mobile-header-and-detail.md` |
| | - Referenced in: `docs/mobile-responsiveness/itds/mobile-touch-targets.md` |
| | - Referenced in: `docs/transactions-page-ux/itds/dropdown-implementation.md` (portal pattern) |
