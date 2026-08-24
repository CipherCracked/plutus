"use client"

import { useEffect } from "react"
import useSWR from "swr"
import { Header } from "@/components/layout/Header"
import { Navigation } from "@/components/layout/Navigation"
import { TransactionTable } from "@/components/transactions/TransactionTable"
import { AnalyticsView } from "@/components/analytics/AnalyticsView"
import { RewardsView } from "@/components/rewards/RewardsView"
import { useUIStore } from "@/stores/ui-store"
import { useTransactionStore } from "@/stores/transaction-store"
import { useRewardsStore } from "@/stores/rewards-store"
import { fetchTransactions, fetchBalance, fetchRewards } from "@/lib/api"

export default function HomePage() {
  const { activeView } = useUIStore()
  const { setTransactions, setLoading, setError } = useTransactionStore()
  const { setBalance, setRewards } = useRewardsStore()

  // SWR caches data client-side; Zustand holds it for instant UI updates.
  // For the 2MB transactions dataset, disable focus revalidation to avoid
  // wasteful re-fetches on tab-switch; extend deduping/tTL for better caching.
  const { data: txnData, error: txnError } = useSWR(
    "/api/transactions",
    () => fetchTransactions(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
      ttl: 300_000,
    },
  )
  // Balance and rewards are small payloads (<1KB) — keep default SWR config
  // so they benefit from focus revalidation for freshness.
  const { data: balanceData } = useSWR("/api/balance", () => fetchBalance())
  const { data: rewardsData } = useSWR("/api/rewards", () => fetchRewards())

  useEffect(() => {
    if (txnData) {
      setTransactions(txnData)
      setLoading(false)
    } else if (txnError) {
      setError(txnError.message)
      setLoading(false)
    } else {
      setLoading(true)
    }
  }, [txnData, txnError, setTransactions, setLoading, setError])

  useEffect(() => {
    if (balanceData) setBalance(balanceData)
  }, [balanceData, setBalance])

  useEffect(() => {
    if (rewardsData) setRewards(rewardsData)
  }, [rewardsData, setRewards])

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <Header />
      <Navigation />

      <main className="flex-1 overflow-hidden p-4">
        {activeView === "transactions" && <TransactionTable />}
        {activeView === "analytics" && <AnalyticsView />}
        {activeView === "rewards" && <RewardsView />}
      </main>
    </div>
  )
}
