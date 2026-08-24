"use client"

import { Logo } from "@/components/ui/Logo"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { clsx } from "clsx"

export function Header() {
  // On mobile (<640px), use icon-only logo to conserve vertical space
  // (IPD 3: mobile-header-and-detail)
  const isDesktop = useMediaQuery("(min-width: 640px)")

  return (
    <header
      className={clsx(
        "sharp-sm glass flex items-center justify-between px-4 py-2.5",
        "transition-base",
      )}
    >
      <div className="flex items-center gap-2">
        {isDesktop ? (
          <Logo variant="full" size="sm" />
        ) : (
          <Logo variant="icon" size="md" />
        )}
      </div>
    </header>
  )
}
