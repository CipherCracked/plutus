/**
 * Plutus API client.
 *
 * Wraps all fetch calls to the FastAPI backend with TypeScript types
 * matching the Pydantic models in server/models.py.
 *
 * Base URL: http://localhost:8000 (dev) — configure for production.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface Transaction {
  id: string
  timestamp: string
  merchant: string
  category: string
  amount: number
  currency: string
  status: string
  payment_method: string
  coins_earned: number
}

export interface CoinBalance {
  balance: number
  username: string
  total_earned: number
  total_redeemed: number
}

export interface Reward {
  id: number
  name: string
  description: string | null
  coin_cost: number
  reward_type: string | null
}

export interface CategoryBreakdown {
  category: string
  total_amount: number
  transaction_count: number
}

export interface MonthlyTrend {
  month: string
  total_amount: number
  transaction_count: number
}

export interface AnalyticsData {
  category_breakdown: CategoryBreakdown[]
  monthly_trend: MonthlyTrend[]
}

export interface RedeemResponse {
  success: boolean
  message: string
  new_balance: number
}

export interface RedeemRequest {
  reward_id: number
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

export async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch(`${API_BASE}/api/transactions`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function fetchBalance(): Promise<CoinBalance> {
  const res = await fetch(`${API_BASE}/api/balance`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function fetchRewards(): Promise<Reward[]> {
  const res = await fetch(`${API_BASE}/api/rewards`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function redeemReward(rewardId: number): Promise<RedeemResponse> {
  const res = await fetch(`${API_BASE}/api/redeem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reward_id: rewardId }),
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const err = await res.json()
      detail = err.detail || detail
    } catch {}
    throw new Error(`HTTP ${res.status}: ${detail}`)
  }
  return res.json()
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE}/api/analytics`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.json()
}
