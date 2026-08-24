/**
 * Plutus logo — a stylized coin with "P" monogram.
 *
 * Visual language: "Raw Aesthetics" — sharp edges, high contrast.
 * The coin outline uses the gold accent (#d4af37) for wealth symbolism.
 * The "P" negative-space cutout represents the Plutus brand mark.
 */

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

export function Logo({ size = "md", showText = true }: LogoProps) {
  const iconSize = {
    sm: 24,
    md: 32,
    lg: 40,
  }[size]

  const textSize = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  }[size]

  return (
    <div className="flex items-center gap-3">
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Coin outer ring */}
        <circle
          cx="12"
          cy="12"
          r="9.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {/* Coin inner glow / edge detail */}
        <circle
          cx="12"
          cy="12"
          r="6.5"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.3"
        />
        {/* P monogram (negative space cutout) */}
        <path
          d="M8.5 7.5H11C11.8284 7.5 12.5 8.1716 12.5 9V11.5V15H8.5V14H11V12H9.5V10H11V9H8.5V7.5Z"
          fill="currentColor"
        />
      </svg>
      {showText && (
        <span className={`font-mono font-medium ${textSize} text-accent tracking-wider`}>
          Plutus
        </span>
      )}
    </div>
  )
}
