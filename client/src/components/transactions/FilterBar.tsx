"use client"

import { useState } from "react"
import { useTransactionStore } from "@/stores/transaction-store"
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
  const [open, setOpen] = useState(false)

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
        {label}
      </label>
      <div
        onClick={() => setOpen(!open)}
        className="sharp-sm flex h-8 w-48 cursor-pointer items-center justify-between bg-surface border border-border px-2 py-1 text-xs font-mono text-foreground"
      >
        <span className={clsx("truncate", selected.length === 0 && "text-text-secondary")}>
          {selected.length > 0 ? `${selected.length} selected` : placeholder}
        </span>
        <span className="text-text-secondary">{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div
          className="sharp-sm z-20 flex flex-col gap-0.5 bg-surface border border-border p-1 shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          {options.map((opt) => {
            const checked = selected.includes(opt)
            return (
              <label
                key={opt}
                className="flex items-center gap-2 px-2 py-1 text-xs font-mono cursor-pointer hover:bg-surface-hover"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleOption(opt)}
                  className="sharp-sm h-3 w-3 cursor-pointer accent-accent"
                />
                <span className={clsx("truncate", !checked && "text-text-secondary")}>
                  {opt}
                </span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface FilterBarProps {
  resultCount: number
  totalCount: number
}

export function FilterBar({ resultCount, totalCount }: FilterBarProps) {
  const { filters, setFilters, clearFilters } = useTransactionStore()

  return (
    <div className="sharp-sm flex flex-wrap items-end gap-4 border-b border-border p-3">
      {/* Merchant search — live as-you-type */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
          Merchant
        </label>
        <input
          type="text"
          placeholder="Search merchants..."
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          className="sharp-sm w-48 bg-surface border border-border px-2 py-1 text-xs font-mono text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Category dropdown */}
      <DropdownFilter
        label="Category"
        options={CATEGORY_OPTIONS}
        selected={filters.category}
        onChange={(vals) => setFilters({ category: vals })}
        placeholder="All categories"
      />

      {/* Status dropdown */}
      <DropdownFilter
        label="Status"
        options={STATUS_OPTIONS}
        selected={filters.status}
        onChange={(vals) => setFilters({ status: vals })}
        placeholder="All statuses"
      />

      {/* Payment method dropdown */}
      <DropdownFilter
        label="Payment"
        options={PAYMENT_OPTIONS}
        selected={filters.payment_method}
        onChange={(vals) => setFilters({ payment_method: vals })}
        placeholder="All payment methods"
      />

      {/* Date range */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
          Date From
        </label>
        <input
          type="date"
          value={filters.date_from || ""}
          onChange={(e) => setFilters({ date_from: e.target.value || null })}
          className="sharp-sm w-36 bg-surface border border-border px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
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
          className="sharp-sm w-36 bg-surface border border-border px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Amount range */}
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
              amount_min: e.target.value ? Number(e.target.value) : null,
            })
          }
          className="sharp-sm w-28 bg-surface border border-border px-2 py-1 text-xs font-mono text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
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
              amount_max: e.target.value ? Number(e.target.value) : null,
            })
          }
          className="sharp-sm w-28 bg-surface border border-border px-2 py-1 text-xs font-mono text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Results count */}
      <div className="text-xs font-mono text-text-secondary">
        {resultCount.toLocaleString()} / {totalCount.toLocaleString()} results
      </div>

      {/* Clear filters */}
      <button
        onClick={clearFilters}
        className="sharp-sm px-3 py-1 text-xs font-mono text-text-secondary hover:text-foreground hover:bg-surface-hover transition-base"
      >
        CLEAR
      </button>
    </div>
  )
}
