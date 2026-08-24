"use client"

import { Logo } from "@/components/ui/Logo"

export function Header() {
  return (
    <header className="sharp-sm glass flex items-center justify-between px-4 py-2.5">
      <Logo variant="full" size="sm" />
    </header>
  )
}
