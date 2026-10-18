import { Suspense } from 'react'
import { AdminCalendarClient } from './calendar-client'
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { calendarParamsCache } from "@/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Content Calendar',
  description: 'Kelola, jadwalkan, dan otomatisasi kalender publikasi konten multi-kanal media sosial Frhm.',
}

export default async function AdminCalendarPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId: parsedClientId } = calendarParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)
  return (
    <Suspense
      fallback={<div className="p-10 animate-pulse text-muted-foreground">Memuat kalender...</div>}
    >
      <DashboardPrefetcher clientId={clientId}>
        <AdminCalendarClient />
      </DashboardPrefetcher>
    </Suspense>
  )
}
