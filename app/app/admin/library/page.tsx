import { Suspense } from "react"
import { LibraryClient } from "@/components/library/library-client"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { libraryParamsCache } from "@/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Media Library",
  description: "Kelola aset media kreatif klien, penyimpanan cloud drive, dan deliverable visual multi-kanal.",
}

export default async function LibraryPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { clientId: parsedClientId } = libraryParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)

  return (
    <Suspense
      fallback={<div className="p-10 animate-pulse text-muted-foreground">Memuat pustaka media...</div>}
    >
      <DashboardPrefetcher clientId={clientId}>
        <LibraryClient />
      </DashboardPrefetcher>
    </Suspense>
  )
}
