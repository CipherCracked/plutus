"use client"

import { useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useTransactionStore, type SortKey } from "@/stores/transaction-store"
import { FilterBar } from "./FilterBar"
import { TransactionDetail } from "./TransactionDetail"
import { clsx } from "clsx"
import { Transaction } from "@/lib/api"

import type { ReactNode } from "react"

interface Column {
  key: SortKey | keyof Transaction
  label: string
  width: number
  align?: "left" | "right" | "center"
  render?: (txn: Transaction) => ReactNode
}

const HEADER_HEIGHT = 44
const ROW_HEIGHT = 48

const COLUMNS: Column[] = [
  { key: "timestamp", label: "Date", width: 140 },
  { key: "merchant", label: "Merchant", width: 260 },
  { key: "category", label: "Category", width: 140 },
  {
    key: "amount",
    label: "Amount",
    width: 120,
    align: "right",
    render: (txn) =>
      txn.amount.toLocaleString("en-IN", {
        style: "currency",
        currency: txn.currency,
        minimumFractionDigits: 2,
      }),
  },
  {
    key: "coins_earned",
    label: "Coins",
    width: 100,
    align: "center",
    render: (txn) => (
      <span
        className={txn.coins_earned > 0 ? "text-accent" : "text-text-secondary"}
      >
        {txn.coins_earned > 0 ? `+${txn.coins_earned}` : "—"}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    width: 140,
    align: "center",
    render: (txn) => (
      <span
        className={clsx(
          "text-xs font-medium uppercase",
          txn.status === "SUCCESS" && "status-success",
          txn.status === "FAILED" && "status-failed",
          txn.status === "PENDING" && "status-pending",
        )}
      >
        {txn.status}
      </span>
    ),
  },
]

const TOTAL_WIDTH = COLUMNS.reduce((sum, c) => sum + c.width, 0)

function SortIcon({
  active,
  order,
}: {
  active: boolean
  order: "asc" | "desc"
}) {
  if (!active) return null
  return (
    <span className="ml-1 text-accent">
      {order === "asc" ? "↑" : "↓"}
    </span>
  )
}

export function TransactionTable() {
  const {
    transactions: allTransactions,
    getFiltered,
    sortKey,
    sortOrder,
    setSort,
    selectedTransaction,
    setSelectedTransaction,
    isLoading,
    error,
  } = useTransactionStore()

  const transactions = getFiltered()
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSort(key, sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSort(key, "desc")
    }
  }

  if (isLoading) {
    return (
      <div className="sharp-sm glass flex h-full w-full items-center justify-center">
        <span className="text-xs font-mono text-text-secondary">
          Loading transactions...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="sharp-sm glass flex h-full w-full items-center justify-center">
        <span className="text-xs font-mono text-failed">Error: {error}</span>
      </div>
    )
  }

  return (
    <div className="sharp-sm glass flex h-full w-full flex-col">
      <FilterBar
        resultCount={transactions.length}
        totalCount={allTransactions.length}
      />

      <div
        ref={parentRef}
        className="relative flex-1 overflow-y-auto overflow-x-hidden"
      >
        {/* Total content height: header + all virtual rows */}
        <div
          style={{
            height: `${HEADER_HEIGHT + rowVirtualizer.getTotalSize()}px`,
            width: "100%",
          }}
        >
          {/* Sticky header */}
          <div
            className="sharp-sm sticky top-0 z-10 flex items-center bg-surface border-b border-border"
            style={{ height: HEADER_HEIGHT }}
          >
            {COLUMNS.map((col) => (
              <button
                key={String(col.key)}
                onClick={() => handleSort(col.key as SortKey)}
                className={clsx(
                  "flex h-full flex-shrink-0 items-center px-3 text-xs font-mono uppercase tracking-wider",
                  "text-text-secondary hover:text-foreground transition-base",
                  sortKey === col.key && "text-accent",
                  {
                    "justify-end": col.align === "right",
                    "justify-center": col.align === "center",
                  },
                )}
                style={{ width: col.width }}
              >
                {col.label}
                <SortIcon
                  active={sortKey === col.key}
                  order={sortOrder}
                />
              </button>
            ))}
          </div>

          {/* Virtual rows */}
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const txn = transactions[virtualRow.index]
            return (
              <div
                key={txn.id}
                className={clsx(
                  "absolute top-0 left-0 flex items-center border-b border-border",
                  "hover:bg-surface-hover cursor-pointer transition-base",
                  selectedTransaction?.id === txn.id && "bg-surface-hover",
                )}
                style={{
                  transform: `translateY(${HEADER_HEIGHT + virtualRow.start}px)`,
                  width: "100%",
                  height: `${virtualRow.size}px`,
                }}
                onClick={() => setSelectedTransaction(txn)}
              >
                {COLUMNS.map((col) => (
                  <div
                    key={`${txn.id}-${String(col.key)}`}
                    className={clsx(
                      "px-3 text-xs font-mono whitespace-nowrap overflow-hidden text-ellipsis",
                      {
                        "text-right": col.align === "right",
                        "text-center": col.align === "center",
                      },
                    )}
                    style={{ width: col.width, flexShrink: 0 }}
                    title={
                      typeof txn[col.key as keyof Transaction] === "string"
                        ? (txn[col.key as keyof Transaction] as string)
                        : undefined
                    }
                  >
                    {col.render
                      ? col.render(txn)
                      : (txn[col.key as keyof Transaction] as string | number)}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Transaction detail slide-over */}
      {selectedTransaction && (
        <TransactionDetail
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  )
}
