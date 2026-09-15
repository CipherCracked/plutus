## Problem to solve

Users need to create, edit, and delete transactions. With the two-type model:
- **Create**: Only Type 2 (manual) transactions can be created via the UI. Type 1 creation is deferred (separate "Pay Bill" flow or webhook).
- **Edit**: Type 1 allows only merchant/category; Type 2 allows all fields.
- **Delete**: Type 1 blocked; Type 2 allowed.

The problem is deciding how these mutation operations should feel in the UI — where forms appear, how confirmation works, how type-aware field disabling works, and how validation errors are shown. This must align with the existing `Overlay` component and fintech design patterns.

## Options

### **Option 1: Modal overlay for create/edit with type-aware field disabling (recommended)**
- **Create (Type 2 only)**: "Add Transaction" button opens a modal overlay (reusing existing `Overlay` component) with a form. Form fields: merchant, category, amount, timestamp, status, payment method. `transaction_type` defaults to `type_2_manual` (hidden or read-only). Submit closes modal, refreshes data.
- **Edit**: Clicking a transaction row opens the same modal pre-filled.
  - **Type 1**: `merchant` and `category` editable; `amount`, `status`, `payment_method`, `currency`, `timestamp` disabled with tooltip "Cannot edit payment transaction fields."
  - **Type 2**: All fields editable.
- **Delete**: Clicking delete icon shows a confirmation modal ("Delete this transaction? This cannot be undone.").
  - **Type 1**: Delete button disabled with tooltip "Payment transactions cannot be deleted." (or hide delete icon entirely).
  - **Type 2**: Confirm → delete, close modal.
- **Validation errors**: Inline field errors (red text under each field) + toast summary on submit failure.
- **Coin preview**: Live "Coins earned: X" preview in form (see `mutation-coin-earning-rules.md`).

### Option 2: Inline row editing with type-aware behavior
- **Create**: Empty row at top of table with inline inputs (Type 2 only).
- **Edit**: Click row → row becomes editable inputs.
  - **Type 1**: Only merchant/category cells become editable; others remain read-only.
  - **Type 2**: All cells editable.
- **Delete**: Hover row → delete icon → click → inline confirmation.
  - **Type 1**: No delete icon.
- **Validation errors**: Inline only, no toast.

### Option 3: Separate page for create/edit
- **Create**: "Add Transaction" navigates to `/transactions/new` page with full form (Type 2 only).
- **Edit**: Click row → navigates to `/transactions/{id}/edit` (type-aware field disabling).
- **Delete**: From edit page, or separate confirmation page.
- **Validation errors**: Full-page form validation, redirect back on error.

## Reasoning

The existing codebase has a well-built `Overlay` component with focus trap, keyboard navigation, and animation. Reusing it for mutation forms maintains consistency with the rewards redeem flow and transaction detail overlay. Modal overlays are standard in fintech for "focused task" flows (adding a transaction is a discrete, completable action). The type-aware field disabling in the modal (Option 1) is cleaner than inline editing — disabled fields in a modal are visually obvious, while inline disabled cells in a virtualized table are harder to style and confuse users. Separate pages add navigation overhead for a simple CRUD operation. Option 1 leverages existing infrastructure, works on mobile, and keeps the user in context.

## Tradeoffs

- Modal overlays can feel heavy if overused — but mutation is a discrete, intentional action, not a frequent micro-interaction.
- Need to ensure SWR cache invalidation triggers correctly after modal closes (mutate key or revalidate).
- Form must handle keyboard accessibility (Tab, Escape to close, Enter to submit) — the `Overlay` component already provides focus trap, but form-specific handling needs implementation.
- Type-aware disabled fields need clear visual distinction (muted color, tooltip on hover) so users understand why they can't edit certain fields.