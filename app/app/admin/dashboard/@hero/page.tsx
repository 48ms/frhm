import { DashboardStitchHero } from "@/components/dashboard-stitch/hero"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"

export default async function DashboardHeroSlot(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId } = searchParamsCache.parse(await props.searchParams)
  return (
    <DashboardPrefetcher clientId={clientId}>
      <DashboardStitchHero />
    </DashboardPrefetcher>
  )
}
