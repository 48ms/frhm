import * as React from "react"
import { SupportView } from "@/components/support/support-view"

export const dynamic = "force-dynamic"

export default function SupportPage() {
  return (
    <React.Suspense
      fallback={<div className="p-8 text-on-surface-variant animate-pulse">Loading Support Center...</div>}
    >
      <SupportView />
    </React.Suspense>
  )
}
