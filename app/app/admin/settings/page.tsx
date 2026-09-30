import * as React from "react"
import { SettingsView } from "@/components/settings/settings-view"

export const dynamic = "force-dynamic"

export default function SettingsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-on-surface-variant animate-pulse">Loading Agency Configuration...</div>}>
      <SettingsView />
    </React.Suspense>
  )
}
