/**
 * Plutus logo — bold geometric "P" (raw aesthetics, 2026 fintech trends).
 *
 * Applied principles from /fintech-ui-2026 skill:
 * - Raw Aesthetics: sharp 90-degree corners, no rounded edges, blocky
 *   construction. Feels like a control panel, not a consumer toy.
 * - Radical Simplicity: single letterform, no extra decoration. Every
 *   path serves a purpose — the P is the mark.
 * - Purposeful: the thick vertical stem conveys stability (trust),
 *   the enclosed bowl with coin ring (subtle inner circle) ties to
 *   wealth without being literal.
 * - Dark-mode first: gold accent (#d4af37) on #0a0a0a, high contrast.
 *
 * The P is built from thick strokes with no curves — pure geometric
 * construction that reads clearly even at 16px (app-icon size).
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
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="text-accent"
      >
        {/* P stem — thick vertical bar */}
        <rect x="5" y="4" width="5" height="20" />

        {/* P bowl — thick horizontal bar + inner ring for coin detail */}
        <rect x="10" y="4" width="9" height="5" />
        <rect x="14" y="8" width="5" height="9" />

        {/* Inner coin ring — subtle circle inside P bowl for wealth association */}
        <circle
          cx="14.5"
          cy="9.5"
          r="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
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
