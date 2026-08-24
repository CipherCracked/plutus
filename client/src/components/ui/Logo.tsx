/**
 * Plutus logo — bold "P" icon + "LUTUS" wordmark.
 *
 * Per /fintech-ui-2026 skill — radical simplicity.
 *
 * The icon is a single bold geometric "P" — sharp 90° corners, no curves,
 * no enclosing circle. The P is unmistakably a P (not H-like). Paired
 * with "LUTUS" in monospace gold, the logo reads as "Plutus" at a glance.
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
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="text-accent"
      >
        {/* Bold geometric P — no enclosing circle to avoid H ambiguity */}
        <path
          d="M7 6 L7 18 L9 18 L9 15 L13 15 L13 18 L15 18 L15 6 L13 6 L13 12 L9 12 L9 6 Z"
          fill="currentColor"
        />
      </svg>
      <span className={`font-mono font-medium ${textSize} text-accent tracking-wider`}>
        LUTUS
      </span>
    </div>
  )
}
