/**
 * Plutus logo — coin + upward arrow.
 *
 * Visual language inspired by 2026 fintech trends (Brandframer, Zillion Designs):
 * - Radically simple: two elements only (coin circle + growth arrow)
 * - AI-resistant: precise geometric construction, non-standard proportions
 * - Conceptual: circle = coin/wealth, arrow = growth/earnings
 * - Modular: recognizable at 16px+ (arrowhead detail preserved at icon size)
 *
 * The "P" is encoded subtly: the arrow stem is the letter's vertical,
 * and the arrowhead sits where the bowl would begin. This makes the mark
 * read as both "growth" and "Plutus" without a wordmark — achieving the
 * 2026 trend of "symbol-only" identity that works on a crowded home screen.
 */

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

export function Logo({ size = "md", showText = false, className }: LogoProps) {
  const iconSize = {
    xs: 16,
    sm: 24,
    md: 32,
    lg: 48,
  }[size]

  const textSize = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  }[size]

  return (
    <div
      className={`flex items-center justify-center ${className || ""}`}
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
        {/* Coin ring (wealth) */}
        <circle
          cx="12"
          cy="12"
          r="8.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* Growth arrow (earnings) — stems from coin, points upward */}
        {/* The arrow stem doubles as the "P" letterform's vertical bar */}
        <path
          d="M12 6 L12 13 M9 9 L12 6 L15 9"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Coin highlight — top-left quadrant, subtle "minted" sheen */}
        <path
          d="M5.5 11.5 C6 10 8.5 7.5 11.5 7.5 C14 7.5 16.5 9 17.5 11"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.25"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <span
          className={`font-mono font-medium ${textSize} text-accent tracking-wider`}
        >
          Plutus
        </span>
      )}
    </div>
  )
}
