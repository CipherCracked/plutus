/**
 * Plutus logo — geometric P + ascending bars + growth swoosh + sparkle.
 *
 * Full mark combines:
 * - Geometric "P" in navy gradient (trust/stability)
 * - Three ascending bars in teal→green gradient (data/earnings)
 * - Orbital swoosh (motion/growth trajectory)
 * - Sparkle accent (insights)
 * - Wordmark "PLUTUS" (for full/desktop displays)
 *
 * Per /fintech-ui-2026 skill: the mark is a single recognizable unit
 * at icon size; the full logo is for splash/landing pages.
 *
 * Theme: dark-first (#0a0a0a background).  The navy P is visible as a
 * subtle shape on the dark surface; the teal/green accent pops.
 */

interface LogoProps {
  variant?: "icon" | "full"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function Logo({ variant = "icon", size = "md", className }: LogoProps) {
  const iconSize = {
    sm: 32,
    md: 40,
    lg: 64,
    xl: 80,
  }[size]

  const fullSizes = {
    sm: { width: 280, height: 90 },
    md: { width: 380, height: 120 },
    lg: { width: 480, height: 150 },
    xl: { width: 600, height: 190 },
  }[size]

  if (variant === "full") {
    return (
      <div
        className={`flex items-center justify-center ${className || ""}`}
        aria-label="Plutus"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1600 620"
          width={fullSizes.width}
          height={fullSizes.height}
          fill="none"
          role="img"
          aria-labelledby="title desc"
        >
          <title id="title">Plutus</title>
          <desc id="desc">
            Plutus logo with a geometric P, ascending bars, growth swoosh
            and sparkle.
          </desc>

          <defs>
            {/* Deep navy for the P and wordmark */}
            <linearGradient
              id="navy"
              x1="120"
              y1="60"
              x2="1450"
              y2="600"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#183B72" />
              <stop offset="1" stopColor="#071A40" />
            </linearGradient>

            {/* Teal / green growth accent */}
            <linearGradient
              id="growth"
              x1="80"
              y1="570"
              x2="600"
              y2="170"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#12B8D1" />
              <stop offset="0.5" stopColor="#20C7B7" />
              <stop offset="1" stopColor="#79E1A1" />
            </linearGradient>
          </defs>

          {/* ========================= */}
          {/* PLUTUS ICON */}
          {/* ========================= */}

          {/* Main geometric P */}
          <path
            d="
              M150 75
              H320
              C445 75 530 150 530 270
              C530 390 445 470 325 470
              H300
              V365
              H325
              C390 365 425 330 425 270
              C425 210 390 180 325 180
              H255
              V435
              C220 445 185 465 150 500
              Z
            "
            fill="url(#navy)"
          />

          {/* White P counter */}
          <path
            d="
              M255 180
              H325
              C390 180 425 210 425 270
              C425 330 390 365 325 365
              H300
              V470
              H255
              Z
            "
            fill="#FFFFFF"
          />

          {/* ========================= */}
          {/* ASCENDING BARS */}
          {/* ========================= */}

          <g fill="url(#growth)">
            <rect x="135" y="440" width="65" height="120" rx="30" />
            <rect x="220" y="385" width="75" height="175" rx="35" />
            <rect x="315" y="315" width="85" height="245" rx="40" />
          </g>

          {/* ========================= */}
          {/* GROWTH SWOOSH */}
          {/* ========================= */}

          <path
            d="
              M90 500
              C45 570 75 625 190 635
              C335 648 500 580 605 455
              C665 385 700 310 720 235

              C690 350 635 445 555 515
              C455 605 320 650 185 635
              C70 622 35 555 90 500
              Z
            "
            fill="url(#growth)"
          />

          {/* ========================= */}
          {/* SPARKLE */}
          {/* ========================= */}

          <path
            d="
              M735 165
              C746 210 765 229 810 240
              C765 251 746 270 735 315
              C724 270 705 251 660 240
              C705 229 724 210 735 165
              Z
            "
            fill="url(#growth)"
          />

          {/* ========================= */}
          {/* WORDMARK */}
          {/* ========================= */}

          <text
            x="820"
            y="365"
            fill="url(#navy)"
            fontFamily="Inter, Arial, Helvetica, sans-serif"
            fontSize="165"
            fontWeight="700"
            letterSpacing="28"
          >
            PLUTUS
          </text>
        </svg>
      </div>
    )
  }

  // Icon-only variant — just the mark (P + bars + swoosh + sparkle)
  // Uses a cropped viewBox that excludes the wordmark
  return (
    <div
      className={`flex items-center justify-center ${className || ""}`}
      aria-label="Plutus"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 820 620"
        width={iconSize}
        height={iconSize}
        fill="none"
        role="img"
        aria-labelledby="title desc"
      >
        <title id="title">Plutus</title>
        <desc id="desc">
          Plutus logo featuring a geometric P, growth bars, upward swoosh
          and sparkle.
        </desc>

        <defs>
          <linearGradient
            id="navy-icon"
            x1="120"
            y1="60"
            x2="820"
            y2="600"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#183B72" />
            <stop offset="1" stopColor="#071A40" />
          </linearGradient>

          <linearGradient
            id="growth-icon"
            x1="80"
            y1="570"
            x2="600"
            y2="170"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#12B8D1" />
            <stop offset="0.5" stopColor="#20C7B7" />
            <stop offset="1" stopColor="#79E1A1" />
          </linearGradient>
        </defs>

        {/* Geometric P */}
        <path
          d="
            M150 75
            H320
            C445 75 530 150 530 270
            C530 390 445 470 325 470
            H300
            V365
            H325
            C390 365 425 330 425 270
            C425 210 390 180 325 180
            H255
            V435
            C220 445 185 465 150 500
            Z
          "
          fill="url(#navy-icon)"
        />

        {/* White P counter */}
        <path
          d="
            M255 180
            H325
            C390 180 425 210 425 270
            C425 330 390 365 325 365
            H300
            V470
            H255
            Z
          "
          fill="#FFFFFF"
        />

        {/* Ascending bars */}
        <g fill="url(#growth-icon)">
          <rect x="135" y="440" width="65" height="120" rx="30" />
          <rect x="220" y="385" width="75" height="175" rx="35" />
          <rect x="315" y="315" width="85" height="245" rx="40" />
        </g>

        {/* Growth swoosh */}
        <path
          d="
            M90 500
            C45 570 75 625 190 635
            C335 648 500 580 605 455
            C665 385 700 310 720 235

            C690 350 635 445 555 515
            C455 605 320 650 185 635
            C70 622 35 555 90 500
            Z
          "
          fill="url(#growth-icon)"
        />

        {/* Sparkle */}
        <path
          d="
            M735 165
            C746 210 765 229 810 240
            C765 251 746 270 735 315
            C724 270 705 251 660 240
            C705 229 724 210 735 165
            Z
          "
          fill="url(#growth-icon)"
        />
      </svg>
    </div>
  )
}
