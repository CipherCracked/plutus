/**
 * Transaction store — manages the 10k-row dataset and all filter/sort state.
 *
 * Per the ITD decision: all 10k rows are loaded once and cached in memory.
 * Filtering, sorting, and search operate against this in-memory array,
 * enabling instant search-as-you-type without network round-trips.
 */

import { create } from "zustand"
import { Transaction } from "@/lib/api"

export type SortKey = "timestamp" | "amount" | "merchant" | "category"
export type SortOrder = "asc" | "desc"

export interface TransactionFilters {
  category: string[]          // multi-select
  status: string[]            // SUCCESS, FAILED, PENDING
  payment_method: string[]
  date_from: string | null
  date_to: string | null
  amount_min: number | null
  amount_max: number | null
  search: string             // merchant search (live as-you-type)
}

interface TransactionState {
  // Data
  transactions: Transaction[]
  isLoading: boolean
  error: string | null
  setTransactions: (txns: Transaction[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Filters
  filters: TransactionFilters
  setFilters: (updates: Partial<TransactionFilters>) => void
  clearFilters: () => void

  // Sort
  sortKey: SortKey
  sortOrder: SortOrder
  setSort: (key: SortKey, order?: SortOrder) => void

  // Pagination (client-side, on top of virtualized rendering)
  currentPage: number
  pageSize: number
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void

  // Selected transaction (for detail modal)
  selectedTransaction: Transaction | null
  setSelectedTransaction: (txn: Transaction | null) => void

  // Computed (filtered + sorted + paginated)
  getFiltered(): Transaction[]
  getCurrentPageData(): Transaction[]
  getTotalPages(): number
}

const DEFAULT_FILTERS: TransactionFilters = {
  category: [],
  status: [],
  payment_method: [],
  date_from: null,
  date_to: null,
  amount_min: null,
  amount_max: null,
  search: "",
}

const INITIAL_SORT: { key: SortKey; order: SortOrder } = {
  key: "timestamp",
  order: "desc",
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  // Data
  transactions: [],
  isLoading: true,
  error: null,
  setTransactions: (txns) => set({ transactions: txns }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Filters
  filters: { ...DEFAULT_FILTERS },
  setFilters: (updates) =>
    set((state) => ({
      filters: { ...state.filters, ...updates },
    })),
  clearFilters: () =>
    set({ filters: { ...DEFAULT_FILTERS }, currentPage: 1 }),

  // Pagination
  currentPage: 1,
  pageSize: 50,
  setCurrentPage: (page) => set({ currentPage: page }),
  setPageSize: (size) => set({ pageSize: size, currentPage: 1 }),

  // Sort
  sortKey: INITIAL_SORT.key,
  sortOrder: INITIAL_SORT.order,
  setSort: (key, order) =>
    set((state) => ({
      sortKey: key,
      sortOrder: order || (state.sortKey === key && state.sortOrder === "asc" ? "desc" : "asc"),
      // Reset to first page on new sort
      currentPage: 1,
    })),

  // Selected transaction
  selectedTransaction: null,
  setSelectedTransaction: (txn) => set({ selectedTransaction: txn }),

  // Computed
  getFiltered: () => {
    const { transactions, filters, sortKey, sortOrder } = get()
    if (!transactions.length) return []

    let filtered = transactions

    // Text search (merchant name)
    const search = filters.search.toLowerCase().trim()
    if (search) {
      filtered = filtered.filter(
        (t) => t.merchant.toLowerCase().includes(search),
      )
    }

    // Array filters
    if (filters.category.length) {
      filtered = filtered.filter((t) => filters.category.includes(t.category))
    }
    if (filters.status.length) {
      filtered = filtered.filter((t) => filters.status.includes(t.status))
    }
    if (filters.payment_method.length) {
      filtered = filtered.filter((t) =>
        filters.payment_method.includes(t.payment_method),
      )
    }

    // Date range
    if (filters.date_from) {
      filtered = filtered.filter(
        (t) => t.timestamp >= filters.date_from!,
      )
    }
    if (filters.date_to) {
      filtered = filtered.filter(
        (t) => t.timestamp <= filters.date_to!,
      )
    }

    // Amount range
    if (filters.amount_min !== null) {
      filtered = filtered.filter((t) => t.amount >= filters.amount_min!)
    }
    if (filters.amount_max !== null) {
      filtered = filtered.filter((t) => t.amount <= filters.amount_max!)
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: string | number
      let bVal: string | number

      switch (sortKey) {
        case "amount":
          aVal = a.amount
          bVal = b.amount
          break
        case "timestamp":
          aVal = new Date(a.timestamp).getTime()
          bVal = new Date(b.timestamp).getTime()
          break
        case "merchant":
        case "category":
          aVal = a[sortKey]
          bVal = b[sortKey]
          break
        default:
          aVal = a[sortKey]
          bVal = b[sortKey]
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  },

  // Computed: current page's slice of filtered data
  getCurrentPageData: (): Transaction[] => {
    const { getFiltered, currentPage, pageSize } = get()
    const filtered = getFiltered()
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  },

  // Computed: total pages from filtered results
  getTotalPages: (): number => {
    const { getFiltered, pageSize } = get()
    const filtered = getFiltered()
    return Math.max(1, Math.ceil(filtered.length / pageSize))
  },
}))
