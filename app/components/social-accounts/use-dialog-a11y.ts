"use client"

import { useEffect, useRef } from "react"

/**
 * Dialog accessibility: Escape to close, focus trap, focus restore.
 * Returns a ref to attach to the dialog panel element.
 *
 * The close callback is held in a ref so the effect depends ONLY on `open`.
 * Without this, an inline `onClose` (new identity each parent render) would
 * re-run the effect and steal focus back to the first field on every keystroke.
 */
export function useDialogA11y(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return

    const panel = panelRef.current
    if (!panel) return

    const previous = document.activeElement as HTMLElement | null
    getFocusable(panel)[0]?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        closeRef.current()
        return
      }
      if (e.key === "Tab") {
        const current = getFocusable(panel)
        if (current.length === 0) return
        const first = current[0]!
        const last = current[current.length - 1]!
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    panel.addEventListener("keydown", handleKey)

    return () => {
      panel.removeEventListener("keydown", handleKey)
      previous?.focus?.()
    }
  }, [open])

  return panelRef
}

function getFocusable(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((el) => el.offsetParent !== null || el === document.activeElement)
}
