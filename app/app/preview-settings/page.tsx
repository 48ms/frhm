import * as React from "react"
import { SettingsView } from "@/components/settings/settings-view"
import { assertPreviewAllowed } from "@/lib/preview-guard"

export const dynamic = "force-dynamic"

export default function PreviewSettingsPage() {
  assertPreviewAllowed()
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <SettingsView />
    </React.Suspense>
  )
}
