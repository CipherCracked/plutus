"use client"

import { useUIStore, type ActiveView } from "@/stores/ui-store"
import { clsx } from "clsx"

const navItems: { id: ActiveView; label: string }[] = [
  { id: "transactions", label: "Transactions" },
  { id: "analytics", label: "Analytics" },
  { id: "rewards", label: "Rewards" },
]

export function Navigation() {
  const { activeView, setActiveView } = useUIStore()

  return (
    <nav className="sharp-sm glass flex items-center gap-1 p-1">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveView(item.id)}
          className={clsx(
            "sharp-sm px-3 py-1.5 text-xs font-mono tracking-wider",
            "transition-base",
            activeView === item.id
              ? "bg-accent text-background"
              : "text-text-secondary hover:text-foreground hover:bg-surface-hover",
          )}
        >
          {item.label.toUpperCase()}
        </button>
      ))}
    </nav>
  )
}
