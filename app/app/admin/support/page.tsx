import * as React from "react"
import { SupportView } from "@/components/support/support-view"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Hotline Dukungan & Kemitraan",
  description: "Pusat bantuan teknis, tiket prioritas, dan dokumentasi operasional platform Frhm.",
}

export default async function SupportPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId: parsedClientId } = searchParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)

  return (
    <React.Suspense
      fallback={<div className="p-8 text-muted-foreground">Memuat Pusat Dukungan...</div>}
    >
      <DashboardPrefetcher clientId={clientId}>
        <SupportView />
      </DashboardPrefetcher>
    </React.Suspense>
  )
}
