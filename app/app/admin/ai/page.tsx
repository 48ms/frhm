import { Suspense } from 'react'
import { AiStudioClient } from '@/components/ai/ai-studio-client'
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"
import AiStudioLoading from "./loading"

export const dynamic = 'force-dynamic'

export default async function AdminAiPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId: parsedClientId } = searchParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)

  return (
    <Suspense fallback={<AiStudioLoading />}>
      <DashboardPrefetcher clientId={clientId}>
        <AiStudioClient />
      </DashboardPrefetcher>
    </Suspense>
  )
}
