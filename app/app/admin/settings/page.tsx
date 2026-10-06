import * as React from "react"
import { SettingsView } from "@/components/settings/settings-view"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"

export const dynamic = "force-dynamic"

export default async function SettingsPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId } = searchParamsCache.parse(await props.searchParams)
  return (
    <React.Suspense fallback={<div className="p-8 text-on-surface-variant animate-pulse">Loading Agency Configuration...</div>}>
      <DashboardPrefetcher clientId={clientId}>
        <SettingsView />
      </DashboardPrefetcher>
    </React.Suspense>
  )
}
