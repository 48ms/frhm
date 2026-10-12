import * as React from "react"
import { SupportView } from "@/components/support/support-view"
import { assertPreviewAllowed } from "@/lib/preview-guard"

export const dynamic = "force-dynamic"

export default function PreviewSupportPage() {
  assertPreviewAllowed()
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <SupportView />
    </React.Suspense>
  )
}
