import { Suspense } from 'react'
import { AdminCalendarClient } from './calendar-client'
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"

export const dynamic = 'force-dynamic'

export default async function AdminCalendarPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId: parsedClientId } = searchParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)
  return (
    <div className="space-y-6">
      <Suspense
        fallback={<div className="p-10 animate-pulse text-muted-foreground">Memuat kalender...</div>}
      >
        <DashboardPrefetcher clientId={clientId}>
          <AdminCalendarClient />
        </DashboardPrefetcher>
      </Suspense>
    </div>
  )
}
