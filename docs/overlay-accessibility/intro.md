# Unified Overlay — Problem Decomposition

## Problem statement

The application has two overlay patterns that share a single responsibility — surfacing transaction detail without navigating away — but are treated as separate concerns:

1. **Mobile (`≤640px`)**: TransactionDetail is a full-screen or bottom-sheet overlay with focus trap, backdrop tap dismissal, swipe-down gesture, and `Escape` key handling. This is documented in `docs/mobile-responsiveness/`.
2. **Desktop (`>640px`)**: TransactionDetail is a side-panel slide-over. Per `README.md` (Not Done), it currently **lacks** focus trap and `Escape` handling. The desktop overlay also shares the same keyboard-navigation contract (`Enter` opens detail, arrow keys traverse rows) but has no documented interaction model for closing it.

The two patterns diverge in implementation (`mobile-responsiveness/` vs nothing for desktop) but share one user flow: select a transaction → view detail → dismiss → return to the table. The split creates duplication risk (if the mobile overlay changes, the desktop overlay should mirror it) and a documentation gap (desktop behavior is only noted as missing in `README.md`).

This folder unifies both viewports under one problem: how should the TransactionDetail overlay behave consistently across mobile and desktop, with accessibility (focus, keyboard, screen-reader announcements) as the unifying constraint rather than viewport size?

## Background and context

- The table uses `@tanstack/react-virtual` and renders ~20 DOM rows at a time. Only visible rows exist in the DOM; keyboard navigation (`↑`/`↓`, `Home`/`End`, `Enter`) relies on index-based traversal (`scrollToIndex`).
- The detail overlay (mobile: full-screen overlay; desktop: slide-over panel) must not break this contract: after opening detail, `Escape` should close it and return focus to the triggering row. After closing, the user must be able to resume keyboard navigation from the same row.
- Mobile overlay docs (`docs/mobile-responsiveness/intro.md`, `docs/mobile-responsiveness/ipds/mobile-header-and-detail.md`, `itds/mobile-overlay-implementation.md`) define bottom-sheet / full-screen behavior, touch targets, sticky footer (`Apply`/`Clear`), and backdrop interactions.
- There is **no** corresponding desktop overlay doc. `README.md` lists the desktop gap explicitly: "Focus trap + Escape handling on the desktop slide-over panel (the mobile overlay has both)."
- The visual language (`docs/plutus-client/ipds/distinctive-visual-language.md`) uses anti-liquid-glass surfaces (75% opacity + 8px blur). The overlay surface must match this regardless of viewport.

## Goals

- Define one interaction model for the TransactionDetail overlay that works on both mobile and desktop.
- Ensure focus management (trap on open, restore on close) is documented and consistent across viewports.
- Document keyboard dismissal (`Escape`) for the desktop slide-over (currently missing).
- Preserve mobile-specific behaviors (swipe-down, backdrop tap, bottom-sheet snap) without forcing them onto desktop.
- Ensure screen-reader announcements (live region for result counts, focus announcements for overlay open/close) apply to both patterns.
- Keep the problem tree shallow — the overlay problem is a sub-problem of table UX, not a replacement for `docs/mobile-responsiveness/` or `docs/transactions-page-ux/`.

## Non-goals

- Rebuilding the table virtualization or changing `@tanstack/react-virtual`.
- Changing the dark-first color scheme or visual tokens (`docs/plutus-client/ipds/distinctive-visual-language.md`).
- Adding new filter types, chart types, or rewards mechanics.
- Producing implementation or code — only `intro.md` and the problem tree.
- Creating separate mobile and desktop folders; this folder unifies them.

## Constraints

- Tailwind CSS v4 is the only styling toolset.
- The overlay must work in three table states: loading skeleton, empty results, and data-loaded.
- Mobile breakpoint: `640px` (`sm:`); desktop: `>640px`.
- The shared Header component must not break (header is common across Transactions, Analytics, Rewards).
- Focus must return to the triggering row (`scrollToIndex`) after overlay close — this is required by the keyboard-navigation contract (`docs/table-performance-enhancement/itds/table-keyboard-navigation.md`).

## Assumptions

1. The mobile overlay behavior (full-screen / bottom-sheet) is acceptable and should not change; the unification is about documentation and consistency, not redesigning mobile.
2. The desktop overlay is a slide-over panel (`position: fixed` or `absolute` side panel), not a full-screen overlay or modal.
3. Focus trap and `Escape` are accessibility requirements, not optional polish — they must apply to both viewports.
4. The live-region announcement for overlay open/close can share the same ARIA mechanism (`docs/mobile-responsiveness/itds/mobile-overlay-implementation.md`).
5. This folder supplements, not replaces, `docs/mobile-responsiveness/` and `docs/transactions-page-ux/`. The mobile folder keeps its own docs; this folder provides the cross-viewport contract.

## Problem tree

```text
Overlay interaction must be consistent across mobile and desktop
├── How should focus be managed (trap on open, restore on close) for both viewports?
├── What dismissal methods apply to each viewport (Escape, backdrop tap, swipe down, close button)?
├── How should the overlay surface (glass, shadow, border) stay consistent with the raw-aesthetics language across both sizes?
├── What keyboard contract must survive overlay open/close (arrow navigation, Home/End, Enter on row)?
└── How should screen-reader state be announced (overlay open, overlay closed, focus returned to row)?
```

## Open questions

1. **Viewport split**: Should the interaction model be defined as "mobile = bottom-sheet, desktop = slide-over" explicitly, or should both viewports support both patterns (e.g., desktop also gets a bottom-sheet on very narrow windows)?
2. **Focus restoration**: Should focus return to the exact DOM node (the row button) or to the table scroll container? The virtualized table only renders ~20 rows; if the triggering row scrolled out of view, `scrollToIndex` must restore it before returning focus.
3. **Unified naming**: Should the component be renamed (e.g., `TransactionDetailOverlay` instead of `TransactionDetail`) to reflect its cross-viewport role, or should the desktop slide-over keep its current name?
4. **Documentation scope**: Should this folder eventually contain IPDs (e.g., `overlay-interaction-model.md`) and ITDs (e.g., `focus-trap-implementation.md`), or remain a lightweight reference folder that links to `mobile-responsiveness/`?
