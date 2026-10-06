import { DashboardStitchKpis } from "@/components/dashboard-stitch/kpi-grid"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"

export default async function DashboardKPISlot(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId } = searchParamsCache.parse(await props.searchParams)
  return (
    <DashboardPrefetcher clientId={clientId}>
      <DashboardStitchKpis />
    </DashboardPrefetcher>
  )
}
