import { Suspense } from 'react'
import type { Metadata } from 'next'
import { AiStudioClient } from '@/components/ai/ai-studio-client'
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { aiParamsCache } from "@/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"
import AiStudioLoading from "./loading"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AI Studio & Content Intelligence | Frhm Studio',
  description: 'AI Hook Generator, Batch Content Planner, Trend Radar, Brand Brain, dan Playbooks strategi pemasaran otomatis.',
}

export default async function AdminAiPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId: parsedClientId } = aiParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)

  return (
    <Suspense fallback={<AiStudioLoading />}>
      <DashboardPrefetcher clientId={clientId}>
        <AiStudioClient />
      </DashboardPrefetcher>
    </Suspense>
  )
}
