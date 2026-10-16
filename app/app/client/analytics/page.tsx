import { Suspense } from "react"
import type { Metadata } from "next"
import { AnalyticsView } from "@/app/admin/analytics/analytics-view"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { analyticsParamsCache } from "@/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"
import { PageContainer } from "@/components/layout/page-container"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Performance Analytics | Frhm Partner Portal",
  description: "Laporan pertumbuhan audiens, metrik jangkauan multi-platform, dan analisis konten terbaik brand Anda.",
}

export default async function ClientAnalyticsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { clientId: parsedClientId } = analyticsParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)

  return (
    <PageContainer
      pageTitle="Analytics & Performance"
      pageDescription="Pantau perkembangan metrik performa multi-kanal, tren audiens, dan konten berkinerja tertinggi."
    >
      <Suspense
        fallback={<div className="p-10 animate-pulse text-muted-foreground text-sm">Memuat performa analitik...</div>}
      >
        <DashboardPrefetcher clientId={clientId}>
          <AnalyticsView />
        </DashboardPrefetcher>
      </Suspense>
    </PageContainer>
  )
}
