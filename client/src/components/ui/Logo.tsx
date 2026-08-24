/**
 * Plutus logo — coin icon + "LUTUS" wordmark.
 *
 * Per /fintech-ui-2026 skill: radical simplicity, raw aesthetics, dark-mode first.
 *
 * The icon is a single coin (circle) with a bold "P" inside — geometric,
 * sharp corners on the P, no extra decoration. The wordmark "LUTUS" uses
 * the monospaced font for data-forward trust. Together: [🔵P] LUTUS = Plutus.
 */

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Logo({ size = "md", className }: LogoProps) {
  const iconSize = {
    sm: 20,
    md: 24,
    lg: 32,
  }[size]

  const textSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  }[size]

  return (
    <div
      className={`flex items-center gap-2 ${className || ""}`}
      aria-label="Plutus"
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-accent"
      >
        {/* Coin ring */}
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="1.25"
        />
        {/* Bold P inside coin — sharp geometric letterform */}
        <path
          d="M8 7 L8 17 L10 17 L10 14 L14 14 L14 17 L16 17 L16 7 L14 7 L14 11 L10 11 L10 7 Z"
          fill="currentColor"
        />
      </svg>
      <span className={`font-mono font-medium ${textSize} text-accent tracking-wider`}>
        LUTUS
      </span>
    </div>
  )
}
