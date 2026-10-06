import { DashboardStitchConnectedHub } from "@/components/dashboard-stitch/right-panel"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"

export default async function DashboardHubSlot(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId } = searchParamsCache.parse(await props.searchParams)
  return (
    <DashboardPrefetcher clientId={clientId}>
      <DashboardStitchConnectedHub />
    </DashboardPrefetcher>
  )
}
