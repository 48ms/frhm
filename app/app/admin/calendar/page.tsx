import { AdminCalendarClient } from './calendar-client'
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"

export const dynamic = 'force-dynamic'

export default async function AdminCalendarPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId } = searchParamsCache.parse(await props.searchParams)
  return (
    <div className="space-y-6">
      <DashboardPrefetcher clientId={clientId}>
        <AdminCalendarClient />
      </DashboardPrefetcher>
    </div>
  )
}
