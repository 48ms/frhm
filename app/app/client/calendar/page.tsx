import { Suspense } from "react"
import type { Metadata } from "next"
import { ClientCalendarView } from "@/components/client/client-calendar-view"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { calendarParamsCache } from "@/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Content Calendar",
  description: "Jadwal kalender publikasi konten, peninjauan materi draf, dan status tayang postingan sosial media brand Anda.",
}

export default async function ClientCalendarPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { clientId: parsedClientId } = calendarParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)

  return (
    <Suspense
      fallback={<div className="p-10 animate-pulse text-muted-foreground text-sm">Memuat kalender konten...</div>}
    >
      <DashboardPrefetcher clientId={clientId}>
        <ClientCalendarView clientId={clientId} />
      </DashboardPrefetcher>
    </Suspense>
  )
}
