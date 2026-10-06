import { CampaignsBoard } from "@/components/campaigns/campaigns-board"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"

export const dynamic = "force-dynamic"

export default async function CampaignsPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId } = searchParamsCache.parse(await props.searchParams)
  return (
    <DashboardPrefetcher clientId={clientId}>
      <CampaignsBoard />
    </DashboardPrefetcher>
  )
}
