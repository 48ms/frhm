"use client"

import * as React from "react"

interface DataState<T> {
  value: T
  timestamp: number
}

function useDataState<T>(
  key: string,
  initialValue: T | undefined,
  onChange?: (value: boolean) => void
): readonly [DataState<T>, React.RefObject<T>] {
  const [data] = React.useState<DataState<T>>({
    value: initialValue as T,
    timestamp: Date.now(),
  })

  const ref = React.useRef<T>(null)

  React.useEffect(() => {
    const element = ref.current as HTMLElement
    if (!element) return

    const observer = new MutationObserver(() => {
      const isHighlighted = element.dataset[key] === "true"
      if (isHighlighted) {
        onChange?.(true)
      }
    })

    observer.observe(element, { attributes: true, attributeFilter: ["data-" + key] })
    return () => observer.disconnect()
  }, [key, onChange])

  return [data, ref]
}

export { useDataState }