import * as React from "react"
import { SettingsView } from "@/components/settings/settings-view"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"

export const dynamic = "force-dynamic"

export default async function SettingsPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId: parsedClientId } = searchParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)
  return (
    <React.Suspense fallback={<div className="p-8 text-on-surface-variant">Memuat Konfigurasi Agensi...</div>}>
      <DashboardPrefetcher clientId={clientId}>
        <SettingsView />
      </DashboardPrefetcher>
    </React.Suspense>
  )
}
