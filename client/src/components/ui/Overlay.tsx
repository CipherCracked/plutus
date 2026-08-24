"use client"

import { useEffect } from "react"
import { createPortal } from "react-dom"
import { clsx } from "clsx"

interface OverlayProps {
  /** Whether the overlay is visible */
  isOpen: boolean
  /** Called on backdrop click, Escape key, or close button tap */
  onClose: () => void
  /** Title shown in the overlay header */
  title?: string
  /** Optional footer content (e.g., Apply / Clear buttons) */
  footer?: React.ReactNode
  /** Additional classes for the content area */
  className?: string
  children: React.ReactNode
}

/**
 * Reusable full-screen overlay component.
 *
 * Per ITD 2 (mobile-overlay-implementation.md):
 * - Renders via createPortal to document.body
 * - position: fixed, full viewport coverage
 * - Scrim backdrop (70% opacity per anti-liquid-glass guideline)
 * - Escape key + backdrop click dismissal
 * - Optional sticky footer for action buttons
 * - Z-index: z-[100] (below dropdowns z-[9999])
 *
 * Used by:
 * - Mobile filter overlay (IPD 1: mobile-filter-strategy)
 * - Mobile TransactionDetail overlay (IPD 3: mobile-header-and-detail)
 */
export function Overlay({
  isOpen,
  onClose,
  title,
  footer,
  className,
  children,
}: OverlayProps) {
  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (!isOpen) return

    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)

    return () => {
      document.body.style.overflow = original
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/60"
      onClick={onClose}
    >
      {/* Content area — clicks here don't close (stopPropagation) */}
      <div
        className={clsx(
          "sharp-sm m-2 flex flex-col flex-1 overflow-y-auto bg-surface",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with title + close button */}
        {title && (
          <div className="sharp-sm sticky top-0 flex items-center justify-between border-b border-border bg-surface p-3">
            <span className="text-xs font-mono uppercase tracking-wider text-text-secondary">
              {title}
            </span>
            <button
              onClick={onClose}
              className={clsx(
                "sharp-sm flex h-11 w-11 items-center justify-center",
                "text-text-secondary hover:text-foreground hover:bg-surface-hover",
                "transition-base",
              )}
              aria-label="Close"
            >
              ⓧ
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 p-3">{children}</div>

        {/* Sticky footer */}
        {footer && (
          <div className="sharp-sm sticky bottom-0 flex items-center justify-end gap-2 border-t border-border bg-surface p-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
