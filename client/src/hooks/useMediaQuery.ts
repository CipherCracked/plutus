import { useEffect, useState } from "react"

/**
 * Subscribe to a CSS media query.
 *
 * Returns `true` when the query matches, `false` otherwise.
 * Updates synchronously on initial render (SSR-safe) and re-evaluates
 * on `resize`/`change` events.
 *
 * Used by ITD 3 (mobile-column-resizing) to switch column widths
 * and row height at the `sm` breakpoint (640px).
 */
export function useMediaQuery(query: string): boolean {
  // Initialize to `false` on both server and first client paint to avoid
  // hydration mismatch.  The correct value propagates after the effect
  // below runs — React reconciles the transition automatically.
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [query])

  return matches
}
