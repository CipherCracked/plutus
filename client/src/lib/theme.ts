/**
 * Plutus design tokens.
 *
 * Visual language: "Raw Aesthetics" + "Anti-Liquid Glass" (2026 trends).
 * - Sharp edges, monospaced financial data, high contrast
 * - Subtle depth via controlled opacity + diffused shadows
 * - Dark-first: true black background (#0a0a0a)
 * - Gold accent for coin/reward interactions
 */

export const theme = {
  // Monochrome base
  background: "#0a0a0a",
  backgroundLight: "#ffffff",
  surface: "#121212",
  surfaceLight: "#f8f8f8",
  surfaceHover: "#1a1a1a",
  surfaceHoverLight: "#f0f0f0",

  // Borders
  border: "#2a2a2a",
  borderLight: "#e5e5e5",

  // Text
  text: "#e5e5e5",
  textLight: "#1a1a1a",
  textSecondary: "#9a9a9a",
  textSecondaryLight: "#6b6b6b",

  // Accent (gold for coins/rewards)
  accent: "#d4af37",
  accentHover: "#e0c266",

  // Status colors
  success: "#22c55e",
  failed: "#ef4444",
  pending: "#f59e0b",

  // Anti-liquid glass
  glassBg: "rgba(18, 18, 28, 0.75)",
  glassBgLight: "rgba(248, 248, 252, 0.85)",
  glassBorder: "rgba(42, 42, 42, 0.5)",
  glassBorderLight: "rgba(229, 229, 229, 0.5)",
  blur: "blur(8px)",

  // Shadows (subtle, diffused)
  shadow: "0 4px 16px 0 rgba(0, 0, 0, 0.3)",
  shadowHover: "0 8px 24px 0 rgba(0, 0, 0, 0.4)",

  // Border radius (sharp)
  radius: {
    none: "0",
    sm: "2px",
    DEFAULT: "0",
    lg: "0",
  },

  // Motion (purposeful, never decorative)
  transition: {
    fast: "150ms ease-out",
    base: "200ms ease-out",
  },

  // Font families
  font: {
    sans: "var(--font-geist-sans)",
    mono: "var(--font-geist-mono)",
  },

  // Chart colors
  chart: {
    categories: [
      "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
      "#ef4444", "#06b6d4", "#f97316", "#84cc16",
    ],
  },
} as const

export type Theme = typeof theme
