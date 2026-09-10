/**
 * Plutus API client.
 *
 * Wraps all fetch calls to the FastAPI backend with TypeScript types
 * matching the Pydantic models in server/models.py.
 *
 * Base URL: http://localhost:8000 (dev) — configure for production.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

function authHeaders(): HeadersInit {
  const token =
    (typeof window !== "undefined" ? localStorage.getItem("plutus_auth_token") : null) ||
    (typeof window !== "undefined" ? sessionStorage.getItem("plutus_auth_token") : null) ||
    undefined
  return token ? { Authorization: `Bearer ${token}` } : {}
}

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
  const res = await fetch(`${API_BASE}/api/balance`, {
    headers: authHeaders(),
  })
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
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
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

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user_profile_id: number
}

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const err = await res.json()
      detail = err.detail || detail
    } catch {}
    throw new Error(`HTTP ${res.status}: ${detail}`)
  }
  const data = await res.json()
  const token = data.token
  if (token) {
    if (typeof window !== "undefined") {
      localStorage.setItem("plutus_auth_token", token)
    }
  }
  return data as LoginResponse
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface RegisterResponse {
  token: string
  user_profile_id: number
}

export async function register(req: RegisterRequest): Promise<RegisterResponse> {
  const res = await fetch(`${API_BASE}/api/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const err = await res.json()
      detail = err.detail || detail
    } catch {}
    throw new Error(`HTTP ${res.status}: ${detail}`)
  }
  const data = await res.json()
  const token = data.token
  if (token) {
    if (typeof window !== "undefined") {
      localStorage.setItem("plutus_auth_token", token)
    }
  }
  return data as RegisterResponse
}

export async function fetchAnalytics(): Promise<AnalyticsData> {
  const res = await fetch(`${API_BASE}/api/analytics`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.json()
}
