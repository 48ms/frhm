import { Suspense } from "react"
import type { Metadata } from "next"
import { EventsBoard } from "@/components/events/events-board"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { PageContainer } from "@/components/layout/page-container"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Events Management | Frhm Studio",
  description: "Kelola jadwal event, aktivasi offline, dan kalender kegiatan klien.",
}

export default async function EventsPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { clientId: parsedClientId } = searchParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)

  return (
    <Suspense fallback={<div className="p-10 animate-pulse text-muted-foreground">Memuat events...</div>}>
      <DashboardPrefetcher clientId={clientId}>
        <PageContainer
          pageTitle="Events & Aktivasi"
          pageDescription="Jadwal event dan aktivasi offline klien"
          className="flex flex-col gap-6 max-w-[1440px] w-full mx-auto"
        >
          <EventsBoard clientId={clientId} />
        </PageContainer>
      </DashboardPrefetcher>
    </Suspense>
  )
}
