import { SVGProps } from "react"

/**
 * Simple coin icon — a circle with a horizontal line through the center.
 * Used in the coins column of the transaction table to visually reinforce
 * the "reward" semantics of the gold badge.
 *
 * Renders via stroke-only SVG so it inherits the parent's text color.
 */
export function CoinIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M7 12h10" />
    </svg>
  )
}
