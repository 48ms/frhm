import { Suspense } from "react"
import { CampaignsBoard } from "@/components/campaigns/campaigns-board"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"

export const dynamic = "force-dynamic"

export default async function CampaignsPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId: parsedClientId } = searchParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)
  return (
    <Suspense
      fallback={<div className="p-10 animate-pulse text-muted-foreground">Memuat kampanye...</div>}
    >
      <DashboardPrefetcher clientId={clientId}>
        <CampaignsBoard />
      </DashboardPrefetcher>
    </Suspense>
  )
}
