import { Suspense } from "react"
import type { Metadata } from "next"
import { SupportView } from "@/components/support/support-view"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"
import { supportParamsCache } from "@/lib/searchparams"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Agency Support Hotline",
  description: "Pusat bantuan langsung, pengajuan tiket request mendesak, dan koordinasi dengan tim Frhm.",
}

export default async function ClientSupportPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { clientId: parsedClientId } = supportParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)

  return (
    <Suspense
      fallback={<div className="p-8 text-muted-foreground text-sm">Memuat Hotline Bantuan...</div>}
    >
      <DashboardPrefetcher clientId={clientId}>
        <SupportView />
      </DashboardPrefetcher>
    </Suspense>
  )
}

