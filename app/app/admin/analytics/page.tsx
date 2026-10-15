import { Suspense } from "react"
import type { Metadata } from "next"
import { AnalyticsView } from "./analytics-view"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"
import { PageContainer } from "@/components/layout/page-container"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Analytics & Multi-Channel Insights | Frhm Studio",
  description: "Pelacakan performa multi-akun, analisis sentimen NLP, perbandingan benchmark industri, dan proyeksi AI tren viral.",
}

export default async function AnalyticsPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId: parsedClientId } = searchParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)
  return (
    <PageContainer
      pageTitle="Analytics & Performance"
      pageDescription="Comprehensive performance tracking, METER evaluation, and campaign metrics."
    >
      <Suspense
        fallback={<div className="p-10 animate-pulse text-muted-foreground">Memuat analitik...</div>}
      >
        <DashboardPrefetcher clientId={clientId}>
          <AnalyticsView />
        </DashboardPrefetcher>
      </Suspense>
    </PageContainer>
  )
}
