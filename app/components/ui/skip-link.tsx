"use client"

import { useState, useEffect } from "react"

export function SkipLink({ href = "#main-content", label = "Skip to main content" }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") setVisible(true)
    }
    const handleMouseDown = () => setVisible(false)
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("mousedown", handleMouseDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("mousedown", handleMouseDown)
    }
  }, [])

  return (
    <a
      href={href}
      className={
        visible
          ? "fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-md border border-border bg-background px-4 py-2 text-sm font-medium shadow-md focus:ring-2 focus:ring-ring"
          : "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-[100] focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md focus:ring-2 focus:ring-ring"
      }
    >
      {label}
    </a>
  )
}