"use client"

import { useEffect } from "react"
import useSWR from "swr"
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
import { fetchAnalytics } from "@/lib/api"
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
  const { data, error, isLoading } = useSWR("/api/analytics", () => fetchAnalytics())
  const { transactions } = useTransactionStore()

  if (isLoading) {
    return (
      <div className="sharp-sm glass flex h-full w-full items-center justify-center">
        <span className="text-xs font-mono text-text-secondary">
          Loading analytics...
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="sharp-sm glass flex h-full w-full items-center justify-center">
        <span className="text-xs font-mono text-failed">Error: {error.message}</span>
      </div>
    )
  }

  // Summary stats from in-memory transactions
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
  const successCount = transactions.filter((t) => t.status === "SUCCESS").length
  const totalCoins = transactions.reduce((sum, t) => sum + t.coins_earned, 0)

  // Bar chart — category breakdown
  const barChartData = {
    labels: data!.category_breakdown.map((c) => c.category),
    datasets: [
      {
        label: "Total Amount",
        data: data!.category_breakdown.map((c) => c.total_amount),
        backgroundColor: barColors,
        borderRadius: 0,
        borderWidth: 0,
        barThickness: 24,
      },
    ],
  }

  // Line chart — monthly trend
  const lineChartData = {
    labels: data!.monthly_trend.map((m) => m.month),
    datasets: [
      {
        label: "Total Amount",
        data: data!.monthly_trend.map((m) => m.total_amount),
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
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 p-4">
        <SummaryCard
          label="Total Spent"
          value={totalAmount.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          })}
          subvalue={`${transactions.length} transactions`}
        />
        <SummaryCard
          label="Coins Earned"
          value={`+${totalCoins.toLocaleString()}`}
          subvalue={`${Math.round((totalCoins / successCount) * 100) / 100 || 0} avg per txn`}
          valueClass="text-accent"
        />
        <SummaryCard
          label="Success Rate"
          value={`${Math.round((successCount / transactions.length) * 100)}%`}
          subvalue={`${successCount} / ${transactions.length} success`}
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-2 gap-4 p-4 pt-0">
        {/* Category breakdown */}
        <div className="sharp-sm h-64 w-full bg-surface border border-border p-3">
          <h3 className="mb-2 text-xs font-mono uppercase tracking-wider text-text-secondary">
            Spend by Category
          </h3>
          <Bar data={barChartData} options={chartOptions} />
        </div>

        {/* Monthly trend */}
        <div className="sharp-sm h-64 w-full bg-surface border border-border p-3">
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
    <div className="sharp-sm bg-surface border border-border p-4">
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
