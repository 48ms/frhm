import { DashboardStitchConnectedHub } from "@/components/dashboard-stitch/right-panel"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"

export default async function DashboardHubSlot(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId: parsedClientId } = searchParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)
  return (
    <DashboardPrefetcher clientId={clientId}>
      <DashboardStitchConnectedHub />
    </DashboardPrefetcher>
  )
}
