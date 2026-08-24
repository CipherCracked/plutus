"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { useTransactionStore } from "@/stores/transaction-store"
import { useDropdown } from "@/hooks/useDropdown"
import { Overlay } from "@/components/ui/Overlay"
import { clsx } from "clsx"

const STATUS_OPTIONS = ["SUCCESS", "FAILED", "PENDING"]
const CATEGORY_OPTIONS = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Utilities",
  "Healthcare",
  "Travel",
  "Education",
]
const PAYMENT_OPTIONS = ["UPI", "Credit Card", "Debit Card", "Cash", "Net Banking"]

interface DropdownFilterProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder: string
}

function DropdownFilter({
  label,
  options,
  selected,
  onChange,
  placeholder,
}: DropdownFilterProps) {
  const { isOpen, toggle, close, triggerRef, dropdownRef, calculatePosition } =
    useDropdown<HTMLDivElement>()

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const position = isOpen ? calculatePosition() : null

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
        {label}
      </label>
      <div
        ref={triggerRef}
        onClick={toggle}
        className={clsx(
          "sharp-sm flex h-11 w-48 cursor-pointer items-center justify-between",
          "bg-surface border border-border px-2 py-1 text-xs font-mono text-foreground",
          "focus-within:ring-1 focus-within:ring-accent min-h-[44px] min-w-[44px]",
          "transition-base",
        )}
      >
        <span
          className={clsx(
            "truncate",
            selected.length === 0 && "text-text-secondary",
          )}
        >
          {selected.length > 0 ? `${selected.length} selected` : placeholder}
        </span>
        <span className="text-text-secondary">
          {isOpen ? "▲" : "▼"}
        </span>
      </div>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={dropdownRef}
            className={clsx(
              "sharp-sm z-[9999] flex flex-col gap-0.5",
              "bg-surface border border-border p-1 shadow-lg",
            )}
            style={{
              position: "fixed",
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
              maxHeight: "240px",
              overflowY: "auto",
            }}
          >
            {options.map((opt) => {
              const checked = selected.includes(opt)
              return (
                <label
                  key={opt}
                  className={clsx(
                    "sharp-sm flex min-h-[44px] min-w-[44px] items-center gap-2",
                    "px-2 py-1 text-xs font-mono cursor-pointer",
                    "hover:bg-surface-hover transition-base",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOption(opt)}
                    className="sharp-sm h-4 w-4 cursor-pointer accent-accent min-h-[44px]"
                  />
                  <span
                    className={clsx(
                      "truncate",
                      !checked && "text-text-secondary",
                    )}
                  >
                    {opt}
                  </span>
                </label>
              )
            })}
          </div>,
          document.body,
        )}
    </div>
  )
}

interface FilterBarProps {
  resultCount: number
  totalCount: number
}

/**
 * All 8 filter controls — shared between desktop grid and mobile overlay.
 * Extracted to avoid duplication (IPD 1: mobile-filter-strategy).
 */
function FilterControls({
  filters,
  setFilters,
}: {
  filters: {
    search: string
    category: string[]
    status: string[]
    payment_method: string[]
    date_from: string | null
    date_to: string | null
    amount_min: number | null
    amount_max: number | null
  }
  setFilters: (updates: Partial<typeof filters>) => void
}) {
  return (
    <>
      {/* GROUP: Search */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
          Merchant
        </label>
        <input
          type="text"
          placeholder="Search merchants..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className={clsx(
            "sharp-sm w-full max-w-sm bg-surface border border-border",
            "px-2 py-1 text-xs font-mono text-foreground",
            "placeholder:text-text-secondary min-h-[44px]",
            "focus:outline-none focus:ring-1 focus:ring-accent",
            "transition-base",
          )}
        />
      </div>

      {/* GROUP: Filter (multi-select dropdowns) */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-mono uppercase tracking-wider text-text-secondary">
          Filter
        </span>
        <DropdownFilter
          label="Category"
          options={CATEGORY_OPTIONS}
          selected={filters.category}
          onChange={(vals) => setFilters({ category: vals })}
          placeholder="All categories"
        />
        <DropdownFilter
          label="Status"
          options={STATUS_OPTIONS}
          selected={filters.status}
          onChange={(vals) => setFilters({ status: vals })}
          placeholder="All statuses"
        />
        <DropdownFilter
          label="Payment"
          options={PAYMENT_OPTIONS}
          selected={filters.payment_method}
          onChange={(vals) => setFilters({ payment_method: vals })}
          placeholder="All payment methods"
        />
      </div>

      {/* GROUP: Range (date + amount) */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-mono uppercase tracking-wider text-text-secondary">
          Range
        </span>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
            Date From
          </label>
          <input
            type="date"
            value={filters.date_from || ""}
            onChange={(e) => setFilters({ date_from: e.target.value || null })}
            className={clsx(
              "sharp-sm w-full bg-surface border border-border",
              "px-2 py-1 text-xs font-mono text-foreground min-h-[44px]",
              "focus:outline-none focus:ring-1 focus:ring-accent",
              "transition-base",
            )}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
            Date To
          </label>
          <input
            type="date"
            value={filters.date_to || ""}
            onChange={(e) => setFilters({ date_to: e.target.value || null })}
            className={clsx(
              "sharp-sm w-full bg-surface border border-border",
              "px-2 py-1 text-xs font-mono text-foreground min-h-[44px]",
              "focus:outline-none focus:ring-1 focus:ring-accent",
              "transition-base",
            )}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
            Min Amount
          </label>
          <input
            type="number"
            placeholder="0"
            value={filters.amount_min ?? ""}
            onChange={(e) =>
              setFilters({
                amount_min: e.target.value
                  ? Number(e.target.value)
                  : null,
              })
            }
            className={clsx(
              "sharp-sm w-full bg-surface border border-border",
              "px-2 py-1 text-xs font-mono text-foreground",
              "placeholder:text-text-secondary min-h-[44px]",
              "focus:outline-none focus:ring-1 focus:ring-accent",
              "transition-base",
            )}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
            Max Amount
          </label>
          <input
            type="number"
            placeholder="∞"
            value={filters.amount_max ?? ""}
            onChange={(e) =>
              setFilters({
                amount_max: e.target.value
                  ? Number(e.target.value)
                  : null,
              })
            }
            className={clsx(
              "sharp-sm w-full bg-surface border border-border",
              "px-2 py-1 text-xs font-mono text-foreground",
              "placeholder:text-text-secondary min-h-[44px]",
              "focus:outline-none focus:ring-1 focus:ring-accent",
              "transition-base",
            )}
          />
        </div>
      </div>
    </>
  )
}

export function FilterBar({ resultCount, totalCount }: FilterBarProps) {
  const { filters, setFilters, clearFilters } = useTransactionStore()
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Collect active filters for display + removal
  const activeFilters: {
    key: string
    label: string
    value: string
    onRemove: () => void
  }[] = []

  // Merchant search
  if (filters.search) {
    const search = filters.search
    activeFilters.push({
      key: "search",
      label: "Merchant",
      value: search,
      onRemove: () => setFilters({ search: "" }),
    })
  }

  // Category
  for (const cat of filters.category) {
    activeFilters.push({
      key: `category-${cat}`,
      label: "Category",
      value: cat,
      onRemove: () =>
        setFilters({ category: filters.category.filter((c) => c !== cat) }),
    })
  }

  // Status
  for (const status of filters.status) {
    activeFilters.push({
      key: `status-${status}`,
      label: "Status",
      value: status,
      onRemove: () =>
        setFilters({ status: filters.status.filter((s) => s !== status) }),
    })
  }

  // Payment method
  for (const pay of filters.payment_method) {
    activeFilters.push({
      key: `payment-${pay}`,
      label: "Payment",
      value: pay,
      onRemove: () =>
        setFilters({
          payment_method: filters.payment_method.filter((p) => p !== pay),
        }),
    })
  }

  // Date range
  if (filters.date_from) {
    activeFilters.push({
      key: "date_from",
      label: "From",
      value: filters.date_from,
      onRemove: () => setFilters({ date_from: null }),
    })
  }
  if (filters.date_to) {
    activeFilters.push({
      key: "date_to",
      label: "To",
      value: filters.date_to,
      onRemove: () => setFilters({ date_to: null }),
    })
  }

  // Amount range
  if (filters.amount_min !== null) {
    activeFilters.push({
      key: "amount_min",
      label: "Min amount",
      value: `₹${filters.amount_min}`,
      onRemove: () => setFilters({ amount_min: null }),
    })
  }
  if (filters.amount_max !== null) {
    activeFilters.push({
      key: "amount_max",
      label: "Max amount",
      value: `₹${filters.amount_max}`,
      onRemove: () => setFilters({ amount_max: null }),
    })
  }

  return (
    <div className="sharp-sm border-b border-border p-3">
      {/* Active filter pills — visible on all screen sizes */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilters.map((f) => (
            <div
              key={f.key}
              className={clsx(
                "sharp-sm flex min-h-[44px] items-center gap-1.5",
                "bg-surface-hover border border-border px-2 py-0.5",
              )}
            >
              <span className="text-xs font-mono text-text-secondary">
                {f.label}:
              </span>
              <span className="text-xs font-mono text-foreground truncate max-w-32">
                {f.value}
              </span>
              <button
                onClick={f.onRemove}
                className={clsx(
                  "sharp-sm flex min-h-[44px] min-w-[44px] items-center",
                  "justify-center text-text-secondary hover:text-accent",
                  "hover:bg-surface transition-base",
                )}
                aria-label={`Remove ${f.label} filter`}
              >
                <span className="text-xs">ⓧ</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --- DESKTOP: Full filter bar (hidden on mobile) --- */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-3 gap-x-4">
          {/* GROUP: Search */}
          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                Merchant
              </label>
              <input
                type="text"
                placeholder="Search merchants..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
                className={clsx(
                  "sharp-sm w-48 bg-surface border border-border",
                  "px-2 py-1 text-xs font-mono text-foreground",
                  "placeholder:text-text-secondary",
                  "focus:outline-none focus:ring-1 focus:ring-accent",
                  "transition-base",
                )}
              />
            </div>
          </div>

          {/* GROUP: Filter (multi-select dropdowns) */}
          <div className="flex items-start gap-3">
            <DropdownFilter
              label="Category"
              options={CATEGORY_OPTIONS}
              selected={filters.category}
              onChange={(vals) => setFilters({ category: vals })}
              placeholder="All categories"
            />
            <DropdownFilter
              label="Status"
              options={STATUS_OPTIONS}
              selected={filters.status}
              onChange={(vals) => setFilters({ status: vals })}
              placeholder="All statuses"
            />
            <DropdownFilter
              label="Payment"
              options={PAYMENT_OPTIONS}
              selected={filters.payment_method}
              onChange={(vals) => setFilters({ payment_method: vals })}
              placeholder="All payment methods"
            />
          </div>

          {/* GROUP: Range (date + amount) */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                Date From
              </label>
              <input
                type="date"
                value={filters.date_from || ""}
                onChange={(e) => setFilters({ date_from: e.target.value || null })}
                className={clsx(
                  "sharp-sm w-36 bg-surface border border-border",
                  "px-2 py-1 text-xs font-mono text-foreground",
                  "focus:outline-none focus:ring-1 focus:ring-accent",
                  "transition-base",
                )}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                Date To
              </label>
              <input
                type="date"
                value={filters.date_to || ""}
                onChange={(e) => setFilters({ date_to: e.target.value || null })}
                className={clsx(
                  "sharp-sm w-36 bg-surface border border-border",
                  "px-2 py-1 text-xs font-mono text-foreground",
                  "focus:outline-none focus:ring-1 focus:ring-accent",
                  "transition-base",
                )}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                Min Amount
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.amount_min ?? ""}
                onChange={(e) =>
                  setFilters({
                    amount_min: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
                className={clsx(
                  "sharp-sm w-28 bg-surface border border-border",
                  "px-2 py-1 text-xs font-mono text-foreground",
                  "placeholder:text-text-secondary",
                  "focus:outline-none focus:ring-1 focus:ring-accent",
                  "transition-base",
                )}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                Max Amount
              </label>
              <input
                type="number"
                placeholder="∞"
                value={filters.amount_max ?? ""}
                onChange={(e) =>
                  setFilters({
                    amount_max: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
                className={clsx(
                  "sharp-sm w-28 bg-surface border border-border",
                  "px-2 py-1 text-xs font-mono text-foreground",
                  "placeholder:text-text-secondary",
                  "focus:outline-none focus:ring-1 focus:ring-accent",
                  "transition-base",
                )}
              />
            </div>
          </div>
        </div>

        {/* Desktop: result count + clear all */}
        <div className="flex items-center justify-between pt-3">
          <div className="text-xs font-mono text-text-secondary">
            {resultCount.toLocaleString()} / {totalCount.toLocaleString()}{" "}
            results
          </div>
          {activeFilters.length > 0 && (
            <button
              onClick={clearFilters}
              className={clsx(
                "sharp-sm px-3 py-1 text-xs font-mono",
                "text-text-secondary hover:text-foreground hover:bg-surface-hover",
                "transition-base",
              )}
            >
              CLEAR ALL
            </button>
          )}
        </div>
      </div>

      {/* --- MOBILE: Compact summary bar (hidden on desktop) --- */}
      <div className="block sm:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono text-text-secondary">
              {resultCount.toLocaleString()} / {totalCount.toLocaleString()}{" "}
              results
            </div>
            {activeFilters.length > 0 && (
              <span className="sharp-sm bg-surface-hover px-1.5 py-0.5 text-xs font-mono text-accent">
                {activeFilters.length} active
              </span>
            )}
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className={clsx(
              "sharp-sm flex min-h-[44px] min-w-[44px] items-center justify-center",
              "px-3 py-1 text-xs font-mono",
              "text-text-secondary hover:text-foreground hover:bg-surface-hover",
              "border border-border transition-base",
            )}
          >
            FILTER
          </button>
        </div>
      </div>

      {/* --- MOBILE: Filter overlay --- */}
      <Overlay
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="FILTERS"
        footer={
          <>
            <button
              onClick={() => {
                clearFilters()
                setIsFilterOpen(false)
              }}
              className={clsx(
                "sharp-sm flex min-h-[44px] min-w-[44px] items-center",
                "px-4 py-1 text-xs font-mono",
                "text-text-secondary hover:text-foreground hover:bg-surface-hover",
                "border border-border transition-base",
              )}
            >
              CLEAR
            </button>
            <button
              onClick={() => setIsFilterOpen(false)}
              className={clsx(
                "sharp-sm flex min-h-[44px] items-center justify-center",
                "px-4 py-1 text-xs font-mono text-accent",
                "hover:text-foreground hover:bg-surface-hover",
                "border border-accent transition-base",
              )}
            >
              APPLY
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FilterControls
            filters={filters}
            setFilters={setFilters}
          />
        </div>
      </Overlay>
    </div>
  )
}
