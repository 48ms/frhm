import * as React from "react"
import { SupportView } from "@/components/support/support-view"

export const dynamic = "force-dynamic"

export default function PreviewSupportPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <SupportView />
    </React.Suspense>
  )
}
