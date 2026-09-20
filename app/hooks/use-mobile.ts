import * as React from "react"

// The sidebar renders as a docked column only when there is genuinely room for it next to
// content. Below 1024px (phones and tablets) it becomes an overlay sheet, otherwise a 256px
// rail plus content overflows the viewport at e.g. 768px. Keep in sync with Tailwind's `lg`.
const MOBILE_BREAKPOINT = 1024

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
