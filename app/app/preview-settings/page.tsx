import * as React from "react"
import { SettingsView } from "@/components/settings/settings-view"

export const dynamic = "force-dynamic"

export default function PreviewSettingsPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <SettingsView />
    </React.Suspense>
  )
}
