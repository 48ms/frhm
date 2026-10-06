import { DashboardStitchPostPipeline } from "@/components/dashboard-stitch/post-pipeline"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"

export default async function DashboardPipelineSlot(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId } = searchParamsCache.parse(await props.searchParams)
  return (
    <DashboardPrefetcher clientId={clientId}>
      <DashboardStitchPostPipeline />
    </DashboardPrefetcher>
  )
}
