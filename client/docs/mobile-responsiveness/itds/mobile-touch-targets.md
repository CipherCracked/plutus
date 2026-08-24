| ITD 1 - "Apply the 44×44px minimum touch target size to all interactive elements using Tailwind utility classes." |  |
| :---- | :---- |
| **The Problem** | The current UI has several interactive elements below the 44×44px WCAG 2.2 minimum touch target size: DropdownFilter trigger buttons are 32px tall (`h-8`), checkboxes inside dropdowns are 12px (`h-3 w-3`), SortIcon click areas in the table header are just the text + arrow, filter pill remove buttons are ~16px, and the "CLEAR ALL" button is 32px tall. On a 360px viewport, users with average finger sizes (~10mm fingertip) struggle to tap these precisely. The question is: how to make all interactive elements meet the 44px minimum without bloating the visual design or disrupting the raw-aesthetics layout? | **Options Considered (Decision In Bold)** |
| **Option 1** | **Add `min-h-[44px] min-w-[44px]` to every interactive element, with `flex items-center justify-center` on the parent.** For dropdown triggers, wrap the checkbox in a 44px label container. For sort headers, add invisible padding. For pills, make the entire pill 44px tall with the ⓧ button inside. For Clear All, increase height to 44px. Use Tailwind's `min-h-11 min-w-11` (44px = 2.75rem = 11 * 4px). |
| **Option 2** | Use a shared CSS class like `.touch-target { min-height: 44px; min-width: 44px; display: inline-flex; align-items: center; justify-content: center; }` and apply it to all interactive elements. This centralizes the rule but deviates from Tailwind-only constraint. |
| **Option 3** | Use `tap-target` pattern — invisible `::before` pseudo-element on each interactive element that extends the hit area to 44×44 without changing the visible element's size. This keeps visual fidelity but adds complexity to every component. |
 | **Option 4** | Skip the 44px requirement — argue that the raw-aesthetics "control panel" design intentionally uses compact controls, and touch users will zoom if needed. |
| **Reasoning** | **Option 1 (Tailwind min-h/min-w utilities)** is the best choice. The Setproduct 2026 data table guide notes that WCAG 2.2 Target Size (Minimum) sets 24×24px as the floor for interactive targets, but Steven Hoober's research (cited in the firecrawl search results) recommends 44×44px for mobile. The /fintech-ui-2026 skill says "Don't be afraid of big target areas" — this directly supports larger tap targets. |
| | Tailwind's `min-h-11` = 44px (`11 × 4px`), `min-w-11` = 44px — this is the canonical Tailwind way. Adding `flex items-center justify-center` to the parent centers the visual element within the enlarged hit area, preserving the raw-aesthetics visual (the actual button looks the same size). |
| | **Why not CSS class** (Option 2): The project constraint is "Tailwind CSS v4 is the only styling toolset" — we must use Tailwind utilities, not custom CSS classes. |
| | **Why not pseudo-element** (Option 3): While the tap-target pseudo-element pattern is valid, it requires modifying the parent container's positioning context and adds complexity to every component. The Tailwind `min-*` approach is simpler and more transparent. |
| | **Why not skip** (Option 4): The 44px minimum is a real usability issue on a 360px screen. Skip is not an option — raw aesthetics means "function-forward design," and inaccessible touch targets make the function fail. |
| **Impact by component** | |
| | `DropdownFilter` trigger: currently `h-8` (32px). Change to `min-h-11` with `flex items-center justify-center`. Visual stays 32px, hit area expands to 44px via padding. |
| | Dropdown checkboxes: currently `h-3 w-3` (12px). Wrap label in `min-h-11 min-w-11` with centered content. The `accent-accent` styling stays the same; only the hit area grows. |
| | Table sort headers: currently just the button text. Add `min-h-11` and pad vertically so the sort button area is 44px tall (header is currently 44px, so just ensure the click target isn't smaller). |
| | Filter pills: make each pill `min-h-11` (full height = 44px would look chunky; instead pad the pill content and ensure the ⓧ button inside is `min-h-11 min-w-11`). |
| | Clear All button: currently `h-8` equivalent. Change to `min-h-11`. |
| | Merchant search input: already full-width in the overlay; the `py-1` + `text-xs` = ~32px height. Add `min-h-11` to the input container. |
| **Tradeoffs** | |
| | - Some elements will have visual padding that makes adjacent spacing feel looser. This is acceptable — raw aesthetics values function over tight packing. |
| | - On desktop, the 44px minimum doesn't change anything (desktop targets are already 32px+ and mouse precision is higher). |
| | - The checkbox inside a dropdown: the label is already `flex items-center`, so wrapping in `min-h-11` just adds vertical padding. The checkbox graphic stays `h-3 w-3`. |
| | - The sort header at `min-h-11` inside the 44px HEADER_HEIGHT means no extra space needed — just ensure the button fills the header height. |
| **Notes** | |
| | - `min-h-11` = 44px in Tailwind's default scale (4px × 11 = 44px). |
| | - The touch target expansion uses padding, not margin — this ensures the hit area extends beyond the visual boundary without affecting layout flow. |
| | - For absolutely positioned elements (like the dropdown checkbox labels), use `min-h-11 py-2` to center within the larger hit area. |
| | - Referenced in: `docs/mobile-responsiveness/ipds/mobile-header-and-detail.md` |
| | - Referenced in: `docs/mobile-responsiveness/ipds/mobile-filter-strategy.md` |
| | - Referenced in: `docs/mobile-responsiveness/itds/mobile-overlay-implementation.md` |
