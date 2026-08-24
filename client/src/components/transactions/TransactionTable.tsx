"use client"

import { useRef, useState, useEffect } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useTransactionStore, type SortKey } from "@/stores/transaction-store"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { FilterBar } from "./FilterBar"
import { TransactionDetail } from "./TransactionDetail"
import { Overlay } from "@/components/ui/Overlay"
import { clsx } from "clsx"
import { Transaction } from "@/lib/api"

import type { ReactNode } from "react"

interface Column {
  key: SortKey | keyof Transaction
  label: string
  width: number
  smWidth?: number
  align?: "left" | "right" | "center"
  render?: (txn: Transaction) => ReactNode
}

const HEADER_HEIGHT = 44
const ROW_HEIGHT_DESKTOP = 48
const ROW_HEIGHT_MOBILE = 40

const COLUMNS: Column[] = [
  { key: "timestamp", label: "Date", width: 90, smWidth: 200 },
  { key: "merchant", label: "Merchant", width: 120, smWidth: 500 },
  { key: "category", label: "Category", width: 90, smWidth: 240 },
  {
    key: "amount",
    label: "Amount",
    width: 80,
    smWidth: 200,
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
    width: 60,
    smWidth: 140,
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
    width: 80,
    smWidth: 220,
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

function TableHeaderCell({
  col,
  sortKey,
  sortOrder,
  onSort,
  colWidth,
  isFirst,
}: {
  col: Column
  sortKey: SortKey
  sortOrder: "asc" | "desc"
  onSort: (key: SortKey) => void
  colWidth: number
  isFirst?: boolean
}) {
  return (
    <button
      key={String(col.key)}
      onClick={() => onSort(col.key as SortKey)}
      className={clsx(
        "flex h-full min-h-[44px] flex-shrink-0 items-center px-3",
        "text-xs font-mono uppercase tracking-wider",
        "text-text-secondary hover:text-foreground",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "transition-base",
        sortKey === col.key && "text-accent",
        // Frozen first column — sticks during horizontal scroll
        isFirst &&
          "sharp-sm sticky left-0 bg-surface z-20 border-r border-border",
        {
          "justify-end": col.align === "right",
          "justify-center": col.align === "center",
        },
      )}
      style={{ width: colWidth }}
    >
      {col.label}
      <SortIcon
        active={sortKey === col.key}
        order={sortOrder}
      />
    </button>
  )
}

export function TransactionTable() {
  const {
    transactions: allTransactions,
    getFiltered,
    getCurrentPageData,
    getTotalPages,
    currentPage,
    pageSize,
    setCurrentPage,
    sortKey,
    sortOrder,
    setSort,
    selectedTransaction,
    setSelectedTransaction,
    isLoading,
    error,
    clearFilters,
  } = useTransactionStore()

  // Responsive layout — mobile uses smaller columns and shorter rows
  const isDesktop = useMediaQuery("(min-width: 640px)")
  const rowHeight = isDesktop ? ROW_HEIGHT_DESKTOP : ROW_HEIGHT_MOBILE

  // Calculate column widths based on breakpoint
  const columnWidths = COLUMNS.map((col) =>
    isDesktop ? (col.smWidth ?? col.width) : col.width,
  )
  const tableWidth = columnWidths.reduce((sum, w) => sum + w, 0)

  // Paginated + sorted data for the current view
  const transactions = getCurrentPageData()
  const totalFiltered = getFiltered().length
  const totalPages = getTotalPages()
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  })

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSort(key, sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSort(key, "desc")
    }
  }

  // Keyboard navigation — virtual rows can't use roving tabindex because
  // they mount/unmount during scroll. Track logical index + scroll into view.
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)

  const handleRowKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    idx: number,
  ) => {
    const maxIndex = transactions.length - 1
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setFocusedIndex(Math.min(idx + 1, maxIndex))
        break
      case "ArrowUp":
        e.preventDefault()
        setFocusedIndex(Math.max(idx - 1, 0))
        break
      case "Home":
        e.preventDefault()
        setFocusedIndex(0)
        break
      case "End":
        e.preventDefault()
        setFocusedIndex(maxIndex)
        break
      case "Enter":
        e.preventDefault()
        setSelectedTransaction(transactions[idx])
        break
    }
  }

  useEffect(() => {
    if (focusedIndex === -1) return
    rowVirtualizer.scrollToIndex(focusedIndex, { align: "center" })
  }, [focusedIndex, rowVirtualizer, transactions.length])

  // Shared header rendering
  const renderHeader = () => (
    <div
      className={clsx(
        "sharp-sm sticky top-0 z-10 flex items-center bg-surface border-b border-border",
        "transition-base",
      )}
      style={{ height: HEADER_HEIGHT, width: tableWidth }}
    >
      {COLUMNS.map((col, i) => (
        <TableHeaderCell
          key={String(col.key)}
          col={col}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={handleSort}
          colWidth={columnWidths[i]}
          isFirst={i === 0}
        />
      ))}
    </div>
  )

  // Shared row rendering for the data table
  const renderRow = (txn: Transaction, offsetY: number, index: number) => (
    <div
      key={txn.id}
      role="row"
      tabIndex={0}
      aria-rowindex={index + 1}
      aria-setsize={transactions.length}
      aria-posinset={index + 1}
      aria-selected={selectedTransaction?.id === txn.id}
      ref={focusedIndex === index ? (el) => el?.focus() : undefined}
      onKeyDown={(e) => handleRowKeyDown(e, index)}
      className={clsx(
        "absolute top-0 left-0 flex items-center border-b border-border",
        "hover:bg-surface-hover focus:outline-none focus-visible:ring-2",
        "focus-visible:ring-accent focus-visible:ring-offset-2",
        "focus-visible:ring-offset-background cursor-pointer transition-base",
        selectedTransaction?.id === txn.id && "bg-surface-hover",
      )}
      style={{
        transform: `translateY(${HEADER_HEIGHT + offsetY}px)`,
        width: `${tableWidth}px`,
        height: `${rowHeight}px`,
      }}
      onClick={() => setSelectedTransaction(txn)}
    >
      {COLUMNS.map((col, i) => {
        const isFirst = i === 0
        return (
          <div
            key={`${txn.id}-${String(col.key)}`}
            className={clsx(
              "px-3 text-xs font-mono whitespace-nowrap overflow-hidden text-ellipsis",
              isFirst &&
                "sharp-sm sticky left-0 bg-surface z-10 border-r border-border",
              {
                "text-right": col.align === "right",
                "text-center": col.align === "center",
              },
            )}
            style={{ width: columnWidths[i], flexShrink: 0 }}
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
        )
      })}
    </div>
  )

  // Loading state — skeleton rows with shimmer animation
  if (isLoading) {
    return (
      <div className="sharp-sm glass h-full w-full flex flex-col">
        <FilterBar
          resultCount={0}
          totalCount={0}
        />
        <div className="relative flex-1 overflow-auto">
          <div
            style={{ height: `${HEADER_HEIGHT + 480}px`, width: `${tableWidth}px` }}
          >
            {renderHeader()}
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="absolute top-0 left-0 flex items-center border-b border-border"
                style={{
                  transform: `translateY(${HEADER_HEIGHT + i * rowHeight}px)`,
                  width: `${tableWidth}px`,
                  height: `${rowHeight}px`,
                }}
              >
                {COLUMNS.map((col, i) => (
                  <div
                    key={`skeleton-${i}-${col.key}`}
                    className="skeleton h-2.5"
                    style={{
                      width: `${Math.max(columnWidths[i] - 24, 24)}px`,
                      marginLeft: col.align === "center" ? "auto" : "12px",
                      marginRight: col.align === "center" ? "auto" : 0,
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="sharp-sm glass flex h-full w-full items-center justify-center">
        <span className="text-xs font-mono text-failed">
          Error loading transactions: {error}
        </span>
      </div>
    )
  }

  if (!transactions.length) {
    return (
      <div className="sharp-sm glass h-full w-full flex flex-col">
        <FilterBar
          resultCount={0}
          totalCount={allTransactions.length}
        />
        <div className="relative flex-1 overflow-auto">
          <div style={{ height: `${HEADER_HEIGHT}px`, width: `${tableWidth}px` }}>
            {renderHeader()}
          </div>
          <div className="flex h-full items-center justify-center py-12">
            <div className="sharp-sm border border-border bg-surface-hover px-6 py-4 text-center">
              {allTransactions.length === 0 ? (
                <>
                  <p className="mb-1 text-xs font-mono uppercase tracking-wider text-text-secondary">
                    No transactions yet
                  </p>
                  <p className="text-xs font-mono text-foreground">
                    Check back after your first payment settles.
                  </p>
                </>
              ) : !totalFiltered ? (
                <>
                  <p className="mb-1 text-xs font-mono uppercase tracking-wider text-text-secondary">
                    No transactions match
                  </p>
                  <p className="text-xs font-mono text-foreground">
                    Try adjusting your filters or clearing them to see all{" "}
                    {allTransactions.length.toLocaleString()} transactions
                  </p>
                  <button
                    onClick={clearFilters}
                    className={clsx(
                      "sharp-sm mt-3 px-3 py-1 text-xs font-mono",
                      "border border-border text-accent hover:text-foreground",
                      "hover:bg-surface-hover transition-base",
                    )}
                  >
                    CLEAR FILTERS
                  </button>
                </>
              ) : (
                <>
                  <p className="mb-1 text-xs font-mono uppercase tracking-wider text-text-secondary">
                    No transactions on this page
                  </p>
                  <p className="text-xs font-mono text-foreground">
                    Showing {totalFiltered} of {allTransactions.length.toLocaleString()} matched transactions
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sharp-sm glass h-full w-full flex flex-col">
      <FilterBar
        resultCount={totalFiltered}
        totalCount={allTransactions.length}
      />

      {/* ARIA live region for sort/filter/pagination announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {totalFiltered} of {allTransactions.length} transactions match your filters.
        Page {currentPage} of {totalPages}. Sorted by {sortKey} {sortOrder === "asc" ? "ascending" : "descending"}.
      </div>

      <div
        ref={parentRef}
        className="relative flex-1 overflow-auto"
      >
        {/* Total content height: header + all virtual rows */}
        <div
          style={{
            height: `${HEADER_HEIGHT + rowVirtualizer.getTotalSize()}px`,
            width: `${tableWidth}px`,
          }}
        >
          {renderHeader()}

          {/* Virtual rows */}
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const txn = transactions[virtualRow.index]
            return renderRow(txn, virtualRow.start, virtualRow.index)
          })}
        </div>
      </div>

      {/* Pagination controls */}
      <div className="sharp-sm flex items-center justify-between border-t border-border px-3 py-2 sm:px-4">
        <span className="text-xs font-mono text-text-secondary">
          {totalFiltered === 0
            ? "0 results"
            : `${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, totalFiltered)} of ${totalFiltered.toLocaleString()} results`}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={clsx(
              "sharp-sm flex min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-0 items-center",
              "px-2 py-1 text-xs font-mono",
              "text-text-secondary hover:text-foreground hover:bg-surface-hover",
              "border border-border transition-base",
              currentPage === 1 && "opacity-30 cursor-not-allowed",
            )}
            aria-label="First page"
          >
            «
          </button>
          <button
            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className={clsx(
              "sharp-sm flex min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-0 items-center",
              "px-2 sm:px-3 py-1 text-xs font-mono",
              "text-text-secondary hover:text-foreground hover:bg-surface-hover",
              "border border-border transition-base",
              currentPage === 1 && "opacity-30 cursor-not-allowed",
            )}
            aria-label="Previous page"
          >
            PREV
          </button>
          <span className="text-xs font-mono text-text-secondary">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={clsx(
              "sharp-sm flex min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-0 items-center",
              "px-3 py-1 text-xs font-mono",
              "text-text-secondary hover:text-foreground hover:bg-surface-hover",
              "border border-border transition-base",
              currentPage === totalPages && "opacity-30 cursor-not-allowed",
            )}
            aria-label="Next page"
          >
            NEXT
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className={clsx(
              "sharp-sm flex min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-0 items-center",
              "px-2 py-1 text-xs font-mono",
              "text-text-secondary hover:text-foreground hover:bg-surface-hover",
              "border border-border transition-base",
              currentPage === totalPages && "opacity-30 cursor-not-allowed",
            )}
            aria-label="Last page"
          >
            »
          </button>
        </div>
      </div>

      {/* Transaction detail — Overlay on mobile, slide-over on desktop */}
      {selectedTransaction && (
        <TransactionDetail
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  )
}
