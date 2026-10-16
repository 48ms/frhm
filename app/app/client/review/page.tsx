import { Suspense } from "react"
import type { Metadata } from "next"
import { ClientReviewHub } from "@/components/client/client-review-hub"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Deliverables Review Hub | Frhm Partner Portal",
  description: "Daftar materi promosi, draf desain, dan publikasi yang menunggu peninjauan dan persetujuan klien.",
}

export default async function ClientReviewPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const parsedClientId = typeof searchParams.clientId === "string" ? searchParams.clientId : null
  const clientId = await resolveClientId(parsedClientId)

  return (
    <Suspense
      fallback={<div className="p-10 animate-pulse text-muted-foreground text-sm">Memuat daftar deliverable...</div>}
    >
      <DashboardPrefetcher clientId={clientId}>
        <ClientReviewHub clientId={clientId} />
      </DashboardPrefetcher>
    </Suspense>
  )
}
