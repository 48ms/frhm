import { AnalyticsView } from "./analytics-view"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId } = searchParamsCache.parse(await props.searchParams)
  return (
    <DashboardPrefetcher clientId={clientId}>
      <AnalyticsView />
    </DashboardPrefetcher>
  )
}
