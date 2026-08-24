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
  const [matches, setMatches] = useState(() => {
    // SSR safety — window may not exist
    if (typeof window === "undefined") return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches)

    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [query])

  return matches
}
