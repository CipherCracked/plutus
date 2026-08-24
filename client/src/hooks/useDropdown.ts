import { useEffect, useRef, useState, useCallback } from "react"

/**
 * Dropdown positioning result returned to the component.
 */
export interface DropdownPosition {
  top: number
  left: number
  width: number
}

/**
 * Reusable dropdown hook — manages open/close state, click-outside,
 * Escape key, and scroll-to-close. Returns refs + helpers.
 *
 * Per ITD 1 (dropdown-implementation.md):
 * - Uses createPortal to document.body (rendering happens in the component)
 * - Positions with position:fixed calculated from trigger's getBoundingClientRect
 * - Closes on click-outside, Escape, or window scroll
 */
export function useDropdown<T extends HTMLElement = HTMLElement>() {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<T>(null)
  const dropdownRef = useRef<T>(null)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  /**
   * Calculate position for the dropdown relative to the trigger element.
   * Uses fixed positioning so it works inside scroll containers.
   * Returns null if the trigger ref isn't mounted yet.
   */
  const calculatePosition = useCallback((): DropdownPosition | null => {
    if (!triggerRef.current) return null

    const rect = triggerRef.current.getBoundingClientRect()
    return {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleOutsideClick = (event: MouseEvent) => {
      // Check if the click was inside the trigger or the dropdown
      const trigger = triggerRef.current
      const dropdown = dropdownRef.current

      if (
        trigger &&
        (event.target instanceof Node && trigger.contains(event.target))
      ) {
        return
      }

      if (
        dropdown &&
        (event.target instanceof Node && dropdown.contains(event.target))
      ) {
        return
      }

      close()
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close()
      }
    }

    const handleScroll = () => {
      // Close on scroll — simplest correct behavior, avoids reposition calculation
      close()
    }

    document.addEventListener("click", handleOutsideClick)
    document.addEventListener("keydown", handleEscape)
    window.addEventListener("scroll", handleScroll, true)

    return () => {
      document.removeEventListener("click", handleOutsideClick)
      document.removeEventListener("keydown", handleEscape)
      window.removeEventListener("scroll", handleScroll, true)
    }
  }, [isOpen, close])

  return {
    isOpen,
    open,
    close,
    toggle,
    triggerRef,
    dropdownRef,
    calculatePosition,
  }
}
