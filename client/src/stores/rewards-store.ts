/**
 * Rewards store — manages coin balance, rewards catalogue, and redemption state.
 */

import { create } from "zustand"
import { CoinBalance, Reward } from "@/lib/api"

interface RewardsState {
  // Data
  balance: CoinBalance | null
  rewards: Reward[]
  isLoading: boolean
  error: string | null

  // Redemption
  selectedReward: Reward | null
  redemptionStatus: "idle" | "confirming" | "success" | "error"
  redemptionError: string | null

  // Actions
  setBalance: (balance: CoinBalance) => void
  setRewards: (rewards: Reward[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setSelectedReward: (reward: Reward | null) => void
  setRedemptionStatus: (status: "idle" | "confirming" | "success" | "error") => void
  setRedemptionError: (error: string | null) => void
  resetRedemption: () => void
}

export const useRewardsStore = create<RewardsState>((set) => ({
  balance: null,
  rewards: [],
  isLoading: false,
  error: null,

  selectedReward: null,
  redemptionStatus: "idle",
  redemptionError: null,

  setBalance: (balance) => set({ balance }),
  setRewards: (rewards) => set({ rewards }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSelectedReward: (reward) => set({ selectedReward: reward }),
  setRedemptionStatus: (status) => set({ redemptionStatus: status }),
  setRedemptionError: (error) => set({ redemptionError: error }),
  resetRedemption: () =>
    set({
      selectedReward: null,
      redemptionStatus: "idle",
      redemptionError: null,
    }),
}))
