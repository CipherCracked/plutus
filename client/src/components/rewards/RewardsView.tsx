"use client"

import { useRewardsStore } from "@/stores/rewards-store"
import { redeemReward } from "@/lib/api"
import { clsx } from "clsx"

export function RewardsView() {
  const { balance, rewards, selectedReward, redemptionStatus, redemptionError, setSelectedReward } =
    useRewardsStore()

  const handleRedeem = async () => {
    if (!selectedReward || !balance) return

    const store = useRewardsStore.getState()
    const cost = selectedReward.coin_cost

    // Snapshot current balance for rollback
    const previousBalance = { ...balance }

    // Optimistically deduct coins immediately
    store.setRedemptionStatus("confirming")
    store.setBalance({ ...balance, balance: balance.balance - cost })

    try {
      const result = await redeemReward(selectedReward.id)
      // Server confirmed — keep the optimistic update (or use server result)
      store.setBalance({ ...balance, balance: result.new_balance })
      store.setRedemptionStatus("success")
      // Clear selection: redemption is complete
      store.setSelectedReward(null)
    } catch (err) {
      // Rollback: restore previous balance
      store.setBalance(previousBalance)
      store.setRedemptionStatus("error")
      store.setRedemptionError(
        err instanceof Error ? err.message : "Redemption failed",
      )
    }
  }

  const canAfford = (cost: number) => (balance?.balance ?? 0) >= cost

  if (!balance) {
    return (
      <div className="sharp-sm glass flex h-full w-full items-center justify-center">
        <span className="text-xs font-mono text-text-secondary">Loading rewards...</span>
      </div>
    )
  }

  return (
    <div className="sharp-sm glass h-full w-full flex flex-col">
      {/* Balance header */}
      <div className="sharp-sm flex items-center justify-between border-b border-border p-3 sm:p-4">
        <div>
          <span className="block text-xs font-mono uppercase tracking-wider text-text-secondary">
            Coin Balance
          </span>
          <span className="mt-1 text-3xl font-mono text-accent">
            {balance.balance.toLocaleString()}
          </span>
        </div>

        <div className="flex gap-6">
          <BalanceStat
            label="Total Earned"
            value={balance.total_earned.toLocaleString()}
          />
          <BalanceStat
            label="Total Redeemed"
            value={balance.total_redeemed.toLocaleString()}
          />
        </div>
      </div>

      {/* Redemption status */}
      {redemptionStatus === "success" && (
        <div className="sharp-sm mx-4 mt-2 border border-success bg-success/10 px-3 py-2">
          <span className="text-xs font-mono text-success">
            ✓ Reward redeemed successfully!
          </span>
        </div>
      )}

      {redemptionStatus === "error" && redemptionError && (
        <div className="sharp-sm mx-4 mt-2 border border-failed bg-failed/10 px-3 py-2">
          <span className="text-xs font-mono text-failed">
            ✗ {redemptionError}
          </span>
        </div>
      )}

      {/* Rewards catalogue — single column on mobile */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 sm:gap-4">
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              onSelect={() => setSelectedReward(reward)}
              selected={selectedReward?.id === reward.id}
              affordable={canAfford(reward.coin_cost)}
            />
          ))}
        </div>
      </div>

      {/* Redemption confirmation (bottom bar when reward selected) */}
      {selectedReward && (
        <div className="sharp-sm flex items-center justify-between border-t border-border p-3 sm:p-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-text-secondary">
              Redeem: {selectedReward.name}
            </span>
            <span className="block text-sm font-mono text-accent">
              Cost: {selectedReward.coin_cost} coins
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedReward(null)}
              className={clsx(
                "sharp-sm flex min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-0 items-center",
                "px-3 py-1.5 text-xs font-mono",
                "text-text-secondary hover:text-foreground hover:bg-surface-hover",
                "transition-base",
              )}
            >
              CANCEL
            </button>
            <button
              onClick={handleRedeem}
              disabled={
                redemptionStatus === "confirming" || !canAfford(selectedReward.coin_cost)
              }
              className={clsx(
                "sharp-sm flex min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-0 items-center",
                "px-4 py-1.5 text-xs font-mono uppercase tracking-wider",
                "transition-base",
                canAfford(selectedReward.coin_cost)
                  ? "bg-accent text-background hover:bg-accent-hover"
                  : "bg-border text-text-secondary cursor-not-allowed",
                redemptionStatus === "confirming" && "opacity-50",
              )}
            >
              {redemptionStatus === "confirming" ? "CONFIRMING..." : "REDEEM"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function BalanceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <span className="block text-xs font-mono uppercase tracking-wider text-text-secondary">
        {label}
      </span>
      <span className="text-xl font-mono text-foreground">{value}</span>
    </div>
  )
}

function RewardCard({
  reward,
  onSelect,
  selected,
  affordable,
}: {
  reward: {
    id: number
    name: string
    description: string | null
    coin_cost: number
    reward_type: string | null
  }
  onSelect: () => void
  selected: boolean
  affordable: boolean
}) {
  return (
    <div
      onClick={onSelect}
      className={clsx(
        "sharp-sm cursor-pointer border p-3 transition-base",
        "min-h-[44px] sm:min-h-0",
        selected
          ? "border-accent bg-surface-hover"
          : "border-border bg-surface hover:border-accent hover:bg-surface-hover",
        !affordable && "opacity-50 grayscale",
      )}
    >
      <div className="mb-1 flex items-start justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-accent">
          {reward.reward_type || "GENERAL"}
        </span>
        <span className="text-xs font-mono text-text-secondary">
          {reward.coin_cost} coins
        </span>
      </div>

      <h3 className="mt-1 text-sm font-mono text-foreground">{reward.name}</h3>
      {reward.description && (
        <p className="mt-1 text-xs font-mono text-text-secondary">
          {reward.description}
        </p>
      )}
    </div>
  )
}
