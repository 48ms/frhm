import { DashboardStitchChart } from "@/components/dashboard-stitch/performance-chart"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"

export default async function DashboardChartSlot(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId } = searchParamsCache.parse(await props.searchParams)
  return (
    <DashboardPrefetcher clientId={clientId}>
      <DashboardStitchChart />
    </DashboardPrefetcher>
  )
}
