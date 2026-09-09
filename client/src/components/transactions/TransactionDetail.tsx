"use client"

import { useMediaQuery } from "@/hooks/useMediaQuery"
import { Overlay } from "@/components/ui/Overlay"
import { clsx } from "clsx"
import { Transaction } from "@/lib/api"
import { useEffect, useRef } from "react"

interface TransactionDetailProps {
  transaction: Transaction
  onClose: () => void
}

export function TransactionDetail({
  transaction,
  onClose,
}: TransactionDetailProps) {
  const isDesktop = useMediaQuery("(min-width: 640px)")
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isDesktop) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    if (!panel) return

      // Focus first focusable element inside panel (close button)
      const focusable = panel.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      )
      if (focusable.length > 0) {
        (focusable[0] as HTMLElement).focus()
      }

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          event.preventDefault()
          onClose()
        }
      }

      const handleTabTrap = (event: KeyboardEvent) => {
        if (event.key !== "Tab" || !panel) return
        const focusableEls = Array.from(
          panel.querySelectorAll<HTMLElement>(
            "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
          ),
        )
        if (focusableEls.length === 0) return

        const first = focusableEls[0]
        const last = focusableEls[focusableEls.length - 1]

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }
      }

      document.addEventListener("keydown", handleEscape)
      document.addEventListener("keydown", handleTabTrap)

      return () => {
        document.removeEventListener("keydown", handleEscape)
        document.removeEventListener("keydown", handleTabTrap)
        previouslyFocused?.focus()
      }
  }, [isDesktop, onClose])

  // Mobile: full-screen overlay (IPD 3: mobile-header-and-detail)
  if (!isDesktop) {
    return (
      <Overlay
        isOpen={true}
        onClose={onClose}
        title="TRANSACTION DETAIL"
      >
        <DetailContent transaction={transaction} onClose={onClose} />
      </Overlay>
    )
  }

  return (
    <>
      {/* Live region for overlay open/close announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {transaction
          ? `Transaction detail opened for ${transaction.merchant}`
          : "Transaction detail closed"}
      </div>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close transaction detail"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onClose()
          }
        }}
      />

      {/* Slide-over panel */}
      <div
        ref={panelRef}
        className="sharp-sm fixed top-0 right-0 z-50 h-screen w-96 bg-surface border-l border-border p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Transaction detail for ${transaction.merchant}`}
      >
        <DetailContent transaction={transaction} onClose={onClose} />
      </div>
    </>
  )
}

function DetailContent({
  transaction,
  onClose,
}: {
  transaction: Transaction
  onClose: () => void
}) {
  return (
    <>
      {/* Close button (overlay header has its own on mobile) */}
      <button
        onClick={onClose}
        className="sharp-sm absolute top-3 right-3 p-1 text-text-secondary hover:text-foreground hover:bg-surface-hover transition-base"
      >
        <span className="text-lg">×</span>
      </button>

      {/* Header */}
      <div className="mb-6">
        <span className="text-xs font-mono uppercase tracking-wider text-accent">
          Transaction #{transaction.id}
        </span>
      </div>

      {/* Status badge */}
      <div className="mb-6">
        <span
          className={clsx(
            "sharp-sm inline-block px-3 py-1 text-xs font-mono uppercase",
            transaction.status === "SUCCESS" && "bg-success/20 text-success",
            transaction.status === "FAILED" && "bg-failed/20 text-failed",
            transaction.status === "PENDING" && "bg-pending/20 text-pending",
          )}
        >
          {transaction.status}
        </span>
      </div>

      {/* Details grid */}
      <div className="space-y-4">
        <DetailRow label="Date" value={transaction.timestamp} />
        <DetailRow label="Merchant" value={transaction.merchant} />
        <DetailRow label="Category" value={transaction.category} />
        <DetailRow label="Payment Method" value={transaction.payment_method} />

        <DetailRow
          label="Amount"
          value={transaction.amount.toLocaleString("en-IN", {
            style: "currency",
            currency: transaction.currency,
            minimumFractionDigits: 2,
          })}
          className="text-accent"
        />

        <DetailRow
          label="Coins Earned"
          value={
            transaction.coins_earned > 0
              ? `+${transaction.coins_earned}`
              : "0"
          }
          className={
            transaction.coins_earned > 0 ? "text-accent" : "text-text-secondary"
          }
        />
      </div>

      {/* Footer note */}
      <div className="absolute bottom-6 left-6 right-6">
        <p className="text-xs font-mono text-text-secondary">
          {transaction.status === "SUCCESS"
            ? "Coins earned at min(floor(amount/100), 50) — 1 coin per ₹100 spent."
            : "No coins earned for this transaction."}
        </p>
      </div>
    </>
  )
}

function DetailRow({
  label,
  value,
  className,
}: {
  label: string
  value: string | number
  className?: string
}) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary">
        {label}
      </label>
      <div
        className={clsx(
          "mt-1 text-sm font-mono text-foreground",
          className,
        )}
      >
        {value}
      </div>
    </div>
  )
}
