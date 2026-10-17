import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { AnalyticsView } from "./analytics-view"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { analyticsParamsCache } from "@/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"
import { PageContainer } from "@/components/layout/page-container"
import { Icons } from "@/components/icons"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Analytics & Multi-Channel Insights | Frhm Studio",
  description: "Pelacakan performa multi-akun, analisis sentimen NLP, perbandingan benchmark industri, dan proyeksi AI tren viral.",
}

export default async function AnalyticsPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId: parsedClientId } = analyticsParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)
  return (
    <PageContainer
      pageTitle="Analytics & Performance"
      pageDescription="Comprehensive performance tracking, METER evaluation, and campaign metrics."
      pageHeaderAction={
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/composer${clientId ? `?clientId=${clientId}` : ""}`}
            className="admin-pill admin-pill-primary flex items-center gap-2 text-xs font-semibold py-2 px-3.5"
          >
            <Icons.sparkles className="size-3.5 text-[hsl(var(--admin-lime))]" />
            <span>Buat Konten Baru</span>
          </Link>
        </div>
      }
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
