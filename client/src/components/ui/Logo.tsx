/**
 * Plutus logo — geometric P + growth bars + orbital swoosh.
 *
 * The full mark combines:
 * - Geometric "P" in navy gradient (trust/stability)
 * - Three growth bars in teal gradient (data/earnings)
 * - Orbital swoosh (motion/growth trajectory)
 * - Sparkle accent (insights)
 * - Wordmark "PLUTUS" + tagline (for large displays)
 *
 * Per /fintech-ui-2026 skill: the mark is a single recognizable unit
 * at icon size; the full logo is for splash/landing pages.
 */

interface LogoProps {
  variant?: "icon" | "full"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Logo({ variant = "icon", size = "md", className }: LogoProps) {
  const iconSize = {
    sm: 24,
    md: 32,
    lg: 48,
  }[size]

  const fullSizes = {
    sm: { width: 240, height: 80 },
    md: { width: 320, height: 108 },
    lg: { width: 400, height: 135 },
  }[size]

  if (variant === "full") {
    return (
      <div className={`flex flex-col items-center ${className || ""}`} aria-label="Plutus">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 1000"
          width={fullSizes.width}
          height={fullSizes.height}
          role="img"
          aria-labelledby="title desc"
        >
          <title id="title">Plutus</title>
          <desc id="desc">
            Plutus logo featuring a geometric P, growth bars, upward swoosh and sparkle.
          </desc>

          <defs>
            <linearGradient id="navyGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#173A73" />
              <stop offset="100%" stopColor="#071C43" />
            </linearGradient>

            <linearGradient id="growthGradient" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#14D8D0" />
              <stop offset="100%" stopColor="#79E0A2" />
            </linearGradient>

            <linearGradient id="swooshGradient" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#1BC8D5" />
              <stop offset="55%" stopColor="#36D9C6" />
              <stop offset="100%" stopColor="#85E4A0" />
            </linearGradient>
          </defs>

          {/* Geometric P */}
          <path
            d="M 340 90 H 620 C 740 90 815 165 815 285 C 815 405 738 490 615 490 H 590 V 390 H 615 C 680 390 715 350 715 285 C 715 220 680 190 620 190 H 440 V 455 C 390 475 355 495 340 525 Z"
            fill="url(#navyGradient)"
          />

          {/* Inner vertical cut to make P more geometric */}
          <rect x="440" y="190" width="105" height="300" fill="#ffffff" />

          {/* Growth bars */}
          <g fill="url(#growthGradient)">
            <rect x="340" y="535" width="70" height="105" rx="32" />
            <rect x="430" y="465" width="80" height="175" rx="38" />
            <rect x="530" y="375" width="90" height="265" rx="42" />
          </g>

          {/* Rising orbital swoosh */}
          <path
            d="M 300 540 C 220 650 320 735 500 710 C 690 685 820 585 900 430 C 935 362 955 305 965 250 C 945 360 900 455 830 530 C 750 618 650 675 510 705 C 355 738 260 705 260 625 C 260 590 275 560 300 540 Z"
            fill="url(#swooshGradient)"
          />

          {/* Sparkle */}
          <path
            d="M 970 230 C 982 278 1002 298 1050 310 C 1002 322 982 342 970 390 C 958 342 938 322 890 310 C 938 298 958 278 970 230 Z"
            fill="url(#growthGradient)"
          />

          {/* Wordmark */}
          <text
            x="600"
            y="845"
            textAnchor="middle"
            fontFamily="var(--font-geist-sans)"
            fontSize="145"
            fontWeight="800"
            letterSpacing="26"
            fill="url(#navyGradient)"
          >
            PLUTUS
          </text>

          {/* Tagline */}
          <rect x="105" y="900" width="100" height="4" rx="2" fill="#27CFC9" />
          <rect x="995" y="900" width="100" height="4" rx="2" fill="#27CFC9" />
          <text
            x="600"
            y="913"
            textAnchor="middle"
            fontFamily="var(--font-geist-sans)"
            fontSize="30"
            fontWeight="500"
            letterSpacing="8"
            fill="#5E718C"
          >
            INSIGHTS. REWARDS. GROWTH.
          </text>
        </svg>
      </div>
    )
  }

  // Icon-only variant — just the mark (P + growth bars + swoosh + sparkle)
  return (
    <div className={`flex items-center justify-center ${className || ""}`} aria-label="Plutus">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 1000"
        width={iconSize}
        height={iconSize}
        role="img"
        aria-labelledby="title desc"
      >
        <title id="title">Plutus</title>
        <desc id="desc">
          Plutus logo featuring a geometric P, growth bars, upward swoosh and sparkle.
        </desc>

        <defs>
          <linearGradient id="navyGradient-icon" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#173A73" />
            <stop offset="100%" stopColor="#071C43" />
          </linearGradient>

          <linearGradient id="growthGradient-icon" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#14D8D0" />
            <stop offset="100%" stopColor="#79E0A2" />
          </linearGradient>

          <linearGradient id="swooshGradient-icon" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#1BC8D5" />
            <stop offset="55%" stopColor="#36D9C6" />
            <stop offset="100%" stopColor="#85E4A0" />
          </linearGradient>
        </defs>

        {/* Geometric P */}
        <path
          d="M 340 90 H 620 C 740 90 815 165 815 285 C 815 405 738 490 615 490 H 590 V 390 H 615 C 680 390 715 350 715 285 C 715 220 680 190 620 190 H 440 V 455 C 390 475 355 495 340 525 Z"
          fill="url(#navyGradient-icon)"
        />

        {/* Inner vertical cut */}
        <rect x="440" y="190" width="105" height="300" fill="#ffffff" />

        {/* Growth bars */}
        <g fill="url(#growthGradient-icon)">
          <rect x="340" y="535" width="70" height="105" rx="32" />
          <rect x="430" y="465" width="80" height="175" rx="38" />
          <rect x="530" y="375" width="90" height="265" rx="42" />
        </g>

        {/* Rising orbital swoosh */}
        <path
          d="M 300 540 C 220 650 320 735 500 710 C 690 685 820 585 900 430 C 935 362 955 305 965 250 C 945 360 900 455 830 530 C 750 618 650 675 510 705 C 355 738 260 705 260 625 C 260 590 275 560 300 540 Z"
          fill="url(#swooshGradient-icon)"
        />

        {/* Sparkle */}
        <path
          d="M 970 230 C 982 278 1002 298 1050 310 C 1002 322 982 342 970 390 C 958 342 938 322 890 310 C 938 298 958 278 970 230 Z"
          fill="url(#growthGradient-icon)"
        />
      </svg>
    </div>
  )
}
