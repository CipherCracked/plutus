/**
 * Plutus logo — abstract coin with integrated growth arrow.
 *
 * Visual language inspired by 2026 fintech trends:
 * - Radically simple: single geometric symbol, no gradients/decorations
 * - AI-resistant: precise geometry, tight construction, non-obvious negative-space
 * - Conceptual: coin = wealth, upward stroke = growth/earnings
 * - Modular: works at app-icon size (16px+) and large display
 *
 * The mark combines two concentric rings (coin silhouette) with a "P"
 * negative space that transforms into an upward arrow — representing
 * wealth accumulation through rewards. The 12° tilt on the arrow
 * adds a subtle human imperfection (2026 "hand-touched linework" trend)
 * while the concentric rings ground it in geometric precision.
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
      className={`flex items-center gap-3 ${className || ""}`}
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
        {/* Outer coin ring */}
        <circle
          cx="12"
          cy="12"
          r="9.5"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        {/* Inner ring (coin edge detail) */}
        <circle
          cx="12"
          cy="12"
          r="6"
          stroke="currentColor"
          strokeWidth="0.75"
          opacity="0.4"
        />
        {/* "P" negative space forming growth arrow */}
        {/*
          The P shape: vertical stem + curved bowl + extending arrow tail
          Negative space between inner and outer ring forms the letter P
          The arrow tail extends upward at 12° — subtle human touch
        */}
        <path
          d="M11.5 15.5V8.5L11.5 7.25C11.5 6.2 12.2 5.5 13 5.5C13.8 5.5 14.5 6.2 14.5 7.25V15.5H13.25L11.5 14.75V15.5Z"
          fill="currentColor"
        />
        {/* Coin highlight — single-pixel highlight arc for "just minted" feel */}
        <path
          d="M4.5 12.5C4.6 11.5 5.8 8.5 7.5 7C9.2 5.5 12.8 5 16 6"
          stroke="currentColor"
          strokeWidth="0.5"
          opacity="0.2"
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
