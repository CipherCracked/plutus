/**
 * UI store — manages global UI state (active view, mobile sidebar).
 *
 * Dark mode removed: the toggle was non-functional because the CSS only
 * responds to `prefers-color-scheme` media queries and there were no
 * Tailwind `dark:` variants or class-based overrides. Removed in favor
 * of a dark-first design.
 */

import { create } from "zustand"

export type ActiveView = "transactions" | "analytics" | "rewards"

interface UIState {
  activeView: ActiveView
  mobileSidebarOpen: boolean
  setActiveView: (view: ActiveView) => void
  setMobileSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeView: "transactions",
  mobileSidebarOpen: false,

  setActiveView: (view) => set({ activeView: view }),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
}))
