## Problem to solve

The TransactionDetail overlay must work consistently across mobile (bottom-sheet/full-screen) and desktop (slide-over panel), but currently the desktop lacks focus trap and Escape handling per `README.md`. The user needs a single interaction contract — open, navigate, dismiss, return — that behaves the same regardless of viewport, with accessibility (focus, keyboard, screen-reader) as the unifying constraint rather than viewport size.

## Options

### Option 1: Unified interaction contract — same keyboard/dismiss rules on both viewports
Both mobile and desktop overlays trap focus on open, restore it to the triggering row on close, respond to `Escape`, and announce state via an ARIA live region. The only viewport difference is the visual container: bottom-sheet/full-screen on mobile, slide-over on desktop.

- *How it feels:* Users learn one pattern. Keyboard navigation (`Enter` opens detail, `Escape` closes it, `↑`/`↓` resumes table traversal) works identically on both. No cognitive split.
- *When it makes sense:* When accessibility is prioritized over viewport-specific visual flair, and when documentation is meant to be unified (`docs/overlay-accessibility/`).

### Option 2: Separate contracts per viewport — mobile is bottom-sheet, desktop is modal-like slide-over with its own rules
Mobile keeps swipe/down/backdrop/escape; desktop uses a close button inside the panel and requires clicking outside or the button, with no `Escape` or focus restoration documented.

- *How it feels:* Desktop feels like a separate feature. Users who switch between devices must learn two dismissal models.
- *When it makes sense:* When desktop and mobile are treated as independent surfaces with no shared interaction contract — but this contradicts the goal of unifying the folder.

### Option 3: Desktop overlay is a non-modal drawer (no focus trap, no keyboard contract)
Desktop slide-over behaves like a side panel that stays open while the user interacts with the table behind it. Only mobile uses a full overlay with focus trap.

- *How it feels:* Desktop becomes a split-view rather than an overlay. The user can browse the table while the panel stays open, which breaks the "select detail → view → dismiss → resume" flow.
- *When it makes sense:* For persistent sidebars or multi-select dashboards — not for a detail view that must close to resume keyboard navigation.

## Reasoning

The `README.md` explicitly notes the desktop gap: focus trap and `Escape` are present on mobile but missing on desktop. This indicates the intended design is a unified contract, not a separate desktop pattern. The problem tree (`docs/overlay-accessibility/intro.md`) frames accessibility — focus management, keyboard dismissal, screen-reader announcements — as the unifying constraint across both viewports. Maintaining separate contracts (Option 2 or 3) would preserve the documentation split and the bug rather than resolve it.

A unified contract means the desktop overlay behaves like the mobile one in interaction terms: it opens on `Enter`, traps focus, announces via live region, and closes on `Escape` or backdrop interaction, then restores focus to the triggering row via `scrollToIndex` (as required by `docs/table-performance-enhancement/itds/table-keyboard-navigation.md`). The only viewport-specific difference remains the visual container, which is a styling concern, not an interaction-model concern.

## Tradeoffs

- A unified contract requires the desktop panel to implement focus trap and `Escape` (currently missing), adding a small amount of code complexity.
- The desktop slide-over must manage backdrop interaction carefully — clicking outside the panel should close it and restore focus, which is slightly more complex than a simple close button.
- Mobile-specific gestures (swipe-down on bottom-sheet) are preserved only on mobile; desktop does not get swipe-down, which is acceptable since desktop users rely on mouse/keyboard.

## Notes

This decision couples with the ITD `focus-trap-implementation.md` (`docs/overlay-accessibility/itds/`) which defines the technical mechanism for focus trap and restoration. It also links to `docs/mobile-responsiveness/ipds/mobile-header-and-detail.md` for mobile-specific visual behavior.
