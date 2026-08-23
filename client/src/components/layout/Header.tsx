"use client"

import { useUIStore } from "@/stores/ui-store"

export function Header() {
  const { darkMode, toggleDarkMode } = useUIStore()

  return (
    <header className="sharp-sm glass flex items-center justify-between px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono tracking-widener text-accent">
          PLVTUS
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleDarkMode}
          className="sharp-sm p-1.5 text-text-secondary hover:text-foreground transition-base"
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>
    </header>
  )
}
