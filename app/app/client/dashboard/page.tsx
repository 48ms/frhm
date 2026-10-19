import { Suspense } from "react"
import type { Metadata } from "next"
import { ClientDashboardView } from "@/components/client/client-dashboard-view"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { dashboardParamsCache } from "@/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"

export const dynamic = "force-dynamic"
export const revalidate = 60  // Cache 60 detik untuk client dashboard

export const metadata: Metadata = {
  title: "Client Overview",
  description: "Ringkasan performa konten, jadwal publikasi media sosial, dan persetujuan draf materi promosi klien.",
}

export default async function ClientDashboardPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { clientId: parsedClientId } = dashboardParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)

  return (
    <Suspense
      fallback={<div className="p-10 animate-pulse text-muted-foreground text-sm">Memuat ringkasan workspace klien...</div>}
    >
      <DashboardPrefetcher clientId={clientId}>
        <ClientDashboardView clientId={clientId} />
      </DashboardPrefetcher>
    </Suspense>
  )
}
