/**
 * Plutus logo — bold geometric "P" with coin bowl + growth arrow.
 *
 * Visual language inspired by 2026 fintech trends:
 * - Radically simple: single "P" letterform, no extra decoration
 * - AI-resistant: precise geometric construction, custom proportions
 * - Conceptual: P-bowl = coin (wealth), upward stem = growth (earnings)
 * - Icon-first: works at app-icon size (16px+) without wordmark
 *
 * The "P" is the primary mark — immediately recognizable as the Plutus
 * brand. The bowl is styled as a coin (gold ring with highlight arc),
 * and the vertical stem terminates in an upward chevron (growth arrow).
 * This keeps the symbol readable while encoding both wealth and growth.
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
        {/* P bowl — coin ring at top-left */}
        <path
          d="M7 6 L7 15 L13 15 C14.65 15 16 13.65 16 12 C16 10.35 14.65 9 13 9 L11 9 L11 6 Z"
          fill="currentColor"
        />

        {/* Coin ring detail — outer edge on bowl */}
        <circle
          cx="10"
          cy="10.5"
          r="2.25"
          stroke="currentColor"
          strokeWidth="0.6"
          opacity="0.3"
        />

        {/* P stem */}
        <line
          x1="7"
          y1="15"
          x2="7"
          y2="19"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />

        {/* Growth arrow — upward chevron at stem base */}
        <path
          d="M5.25 19 L7 17.25 L8.75 19"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Coin highlight — subtle sheen on bowl */}
        <path
          d="M8 8 C8.5 7.5 9.5 7.5 10 8 C10.5 8.5 10.5 9.5 10 10"
          stroke="currentColor"
          strokeWidth="0.4"
          opacity="0.2"
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
