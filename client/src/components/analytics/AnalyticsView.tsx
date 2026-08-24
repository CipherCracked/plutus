"use client"

import useSWR from "swr"
import { clsx } from "clsx"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js"
import { Bar, Line } from "react-chartjs-2"
import type { ChartEvent } from "chart.js"
import { fetchBalance, fetchRewards } from "@/lib/api"
import { useTransactionStore } from "@/stores/transaction-store"

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
)

// Raw aesthetics chart config — monospaced, sharp, dark
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        font: { family: "monospace", size: 10 },
        color: "#9a9a9a",
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: "#121212",
      borderColor: "#2a2a2a",
      borderWidth: 1,
      cornerRadius: 0,
      titleFont: { family: "monospace", size: 10 },
      bodyFont: { family: "monospace", size: 11 },
      padding: 8,
    },
  },
  scales: {
    x: {
      grid: { color: "rgba(42, 42, 42, 0.3)", drawBorder: false },
      ticks: { font: { family: "monospace", size: 10 }, color: "#9a9a9a" },
    },
    y: {
      grid: { color: "rgba(42, 42, 42, 0.3)", drawBorder: false },
      ticks: { font: { family: "monospace", size: 10 }, color: "#9a9a9a" },
    },
  },
} as const

const barColors = ["#d4af37", "#22c55e", "#ef4444", "#f59e0b", "#3b82f6", "#a855f7", "#ec4899", "#06b6d4"]

export function AnalyticsView() {
  const { data: balance, isLoading: balanceLoading } = useSWR("/api/balance", () => fetchBalance())
  const { setFilters, filters } = useTransactionStore()

  const {
    transactions,
    getFiltered,
  } = useTransactionStore()

  // Derive chart data from in-memory filtered transactions (single source of truth with the table)
  const filteredTxns = getFiltered()

  // Category breakdown aggregation
  const categoryMap = filteredTxns.reduce(
    (acc, t) => {
      if (!t.category) return acc
      if (!acc[t.category]) acc[t.category] = { total: 0, count: 0 }
      acc[t.category].total += t.amount
      acc[t.category].count += 1
      return acc
    },
    {} as Record<string, { total: number; count: number }>,
  )

  const categoryData = Object.entries(categoryMap)
    .map(([category, data]) => ({ category, total: data.total, count: data.count }))
    .sort((a, b) => b.total - a.total)

  // Monthly trend aggregation
  const monthMap = filteredTxns.reduce(
    (acc, t) => {
      const month = t.timestamp.slice(0, 7) // YYYY-MM
      if (!acc[month]) acc[month] = { total: 0, count: 0 }
      acc[month].total += t.amount
      acc[month].count += 1
      return acc
    },
    {} as Record<string, { total: number; count: number }>,
  )

  const monthlyData = Object.entries(monthMap)
    .map(([month, data]) => ({ month, total: data.total, count: data.count }))
    .sort((a, b) => a.month.localeCompare(b.month))

  // Loading / error / empty states
  if (balanceLoading && !balance) {
    return (
      <div className="sharp-sm glass flex h-full w-full items-center justify-center">
        <span className="text-xs font-mono text-text-secondary">
          Loading analytics...
        </span>
      </div>
    )
  }

  if (!transactions.length) {
    return (
      <div className="sharp-sm glass flex h-full w-full items-center justify-center">
        <span className="text-xs font-mono text-text-secondary">
          No data in current view
        </span>
      </div>
    )
  }

  // Summary stats from in-memory filtered transactions
  const totalAmount = filteredTxns.reduce((sum, t) => sum + t.amount, 0)
  const successCount = filteredTxns.filter((t) => t.status === "SUCCESS").length
  const totalCoins = filteredTxns.reduce((sum, t) => sum + t.coins_earned, 0)

  // Active category filter (for chart bar highlight)
  const activeCategory = filters.category.length === 1 ? filters.category[0] : null

  // Detect if any non-category filter is active (for chart dimming)
  const hasNonCategoryFilter =
    (filters.search && filters.search.length > 0) ||
    (filters.status && filters.status.length > 0) ||
    (filters.payment_method && filters.payment_method.length > 0) ||
    filters.date_from !== null ||
    filters.date_to !== null ||
    filters.amount_min !== null ||
    filters.amount_max !== null

  // Bar chart — category breakdown with click-to-filter
  // When a non-category filter is active and no category is selected, dim all bars
  const dimColor = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},0.6)`
  }

  const barBgs = categoryData.map((c) => {
    if (c.category === activeCategory) return "#e0c266"
    const baseColor = barColors[categoryData.findIndex((d) => d.category === c.category) % barColors.length]
    if (hasNonCategoryFilter && !activeCategory) {
      return dimColor(baseColor)
    }
    return baseColor
  })

  const barChartData = {
    labels: categoryData.map((c) => c.category),
    datasets: [
      {
        label: "Total Amount",
        data: categoryData.map((c) => c.total),
        backgroundColor: barBgs,
        borderRadius: 0,
        borderWidth: 0,
        barThickness: 24,
        // chart-js doesn't support per-bar colors that change on click out of the box,
        // but the above backgroundColor is recomputed on each render so it stays in sync
      },
    ],
  }

  // Click handler for category bars
  const barChartOptions = {
    ...chartOptions,
    onClick: (_event: ChartEvent, elements: unknown) => {
      const chartElements = elements as { datasetIndex: number; index: number }[]
      if (!chartElements || chartElements.length === 0) return
      const idx = chartElements[0].index
      const clickedCategory = categoryData[idx]?.category
      if (!clickedCategory) return
      setFilters({ category: [clickedCategory] })
    },
    plugins: {
      ...chartOptions.plugins,
      legend: { display: false },
    },
  }

  // Line chart — monthly trend
  const lineChartData = {
    labels: monthlyData.map((m) => m.month),
    datasets: [
      {
        label: "Total Amount",
        data: monthlyData.map((m) => m.total),
        borderColor: "#d4af37",
        backgroundColor: "rgba(212, 175, 55, 0.1)",
        borderWidth: 1,
        pointRadius: 3,
        pointBackgroundColor: "#d4af37",
        pointBorderColor: "#0a0a0a",
        pointBorderWidth: 1,
        fill: true,
        tension: 0.3,
      },
    ],
  }

  return (
    <div className="sharp-sm glass h-full w-full flex flex-col">
      {/* Summary cards — stack vertically on mobile */}
      <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-3 sm:gap-4 sm:p-4">
        <SummaryCard
          label="Total Spent"
          value={totalAmount.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          })}
          subvalue={`${filteredTxns.length} transactions`}
        />
        <SummaryCard
          label="Coins Earned"
          value={`+${totalCoins.toLocaleString()}`}
          subvalue={`${Math.round((totalCoins / (successCount || 1)) * 100) / 100 || 0} avg per txn`}
          valueClass="text-accent"
        />
        <SummaryCard
          label="Success Rate"
          value={`${Math.round((successCount / (filteredTxns.length || 1)) * 100)}%`}
          subvalue={`${successCount} / ${filteredTxns.length} success`}
        />
      </div>

      {/* Charts grid — stack vertically on mobile */}
      <div className="grid grid-cols-1 gap-3 p-3 pt-0 sm:grid-cols-2 sm:gap-4 sm:p-4">
        {/* Category breakdown — clickable bars */}
        <div className="sharp-sm h-48 w-full bg-surface border border-border p-2 sm:h-64 sm:p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                Spend by Category
              </h3>
              {hasNonCategoryFilter && !activeCategory && (
                <span className="whitespace-nowrap text-xs font-mono text-accent">
                  · filtered: {filteredTxns.length} of {transactions.length}
                </span>
              )}
            </div>
            {activeCategory && (
              <button
                onClick={() => setFilters({ category: [] })}
                className={clsx(
                  "sharp-sm flex min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-0 items-center",
                  "px-2 py-0.5 text-xs font-mono text-accent",
                  "hover:text-foreground hover:bg-surface-hover transition-base",
                )}
                title="Clear category filter"
              >
                × CLEAR
              </button>
            )}
          </div>
          <Bar data={barChartData} options={barChartOptions} />
          {filteredTxns.length < transactions.length && (
            <span className="block mt-1 text-xs font-mono text-text-secondary">
              Showing {filteredTxns.length} / {transactions.length} transactions
            </span>
          )}
        </div>

        {/* Monthly trend */}
        <div className="sharp-sm h-48 w-full bg-surface border border-border p-2 sm:h-64 sm:p-3">
          <h3 className="mb-2 text-xs font-mono uppercase tracking-wider text-text-secondary">
            Monthly Trend
          </h3>
          <Line data={lineChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  subvalue,
  valueClass,
}: {
  label: string
  value: string
  subvalue: string
  valueClass?: string
}) {
  return (
    <div className="sharp-sm bg-surface border border-border p-3 sm:p-4">
      <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary">
        {label}
      </label>
      <div className={`mt-1 text-2xl font-mono ${valueClass || "text-foreground"}`}>
        {value}
      </div>
      <div className="mt-1 text-xs font-mono text-text-secondary">
        {subvalue}
      </div>
    </div>
  )
}
