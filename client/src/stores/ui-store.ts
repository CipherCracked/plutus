/**
 * UI store — manages global UI state (active view, dark mode, mobile sidebar).
 */

import { create } from "zustand"

export type ActiveView = "transactions" | "analytics" | "rewards"

interface UIState {
  activeView: ActiveView
  darkMode: boolean
  mobileSidebarOpen: boolean
  setActiveView: (view: ActiveView) => void
  toggleDarkMode: () => void
  setMobileSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeView: "transactions",
  darkMode: true, // dark-first per 2026 trend
  mobileSidebarOpen: false,

  setActiveView: (view) => set({ activeView: view }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
}))
