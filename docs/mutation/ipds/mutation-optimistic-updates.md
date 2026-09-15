## Problem to solve

When a user creates, edits, or deletes a transaction, should the UI update immediately (optimistic) and roll back on error, or wait for the server response? This affects perceived performance and error handling complexity.

## Options

### **Option 1: Wait for server response (recommended)**
- User clicks "Save" / "Delete" → loading state → on success, SWR revalidates → UI updates.
- On error, toast shows error message, form stays open with user's input preserved.
- Simpler mental model: what you see is what the server has.
- No rollback logic, no temporary state reconciliation.

### Option 2: Optimistic updates with rollback
- Create: Add temporary transaction to Zustand/SWR cache immediately with `pending: true`. On success, replace with real. On error, remove temporary, show toast.
- Edit: Update cache immediately. On error, revert to previous values, show toast.
- Delete: Remove from cache immediately. On error, re-insert, show toast.
- Requires: temporary IDs, rollback logic, handling concurrent mutations, cache reconciliation.

### Option 3: Hybrid — optimistic for delete, wait for create/edit
- Delete: Immediate removal from UI (feels fast, low risk — deleted item just reappears on error).
- Create/Edit: Wait for server (higher complexity, validation errors common).
- Partial optimistic benefit, partial simplicity.

## Reasoning

The current stack uses SWR for data fetching and Zustand for balance state. SWR's `mutate` can do optimistic updates, but the mutation endpoints are simple and fast (single-row inserts/updates on indexed `user_id`). Network latency is low (same region Supabase). The complexity of optimistic updates (temporary IDs, rollback, race conditions, cache reconciliation) outweighs the perceived speed gain for this scope. Option 1 is standard for fintech — users expect confirmation that their money data is saved. A brief loading spinner on a modal is acceptable UX. If latency becomes an issue later, optimistic can be added incrementally.

## Tradeoffs

- Slightly slower perceived performance on create/edit/delete — but honest (no false success).
- Simpler code: no optimistic logic, no rollback bugs, easier testing.
- If we add realtime/collaborative features later, optimistic becomes more valuable — but not needed now.