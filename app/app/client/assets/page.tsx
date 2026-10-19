import { Suspense } from "react"
import type { Metadata } from "next"
import { LibraryClient } from "@/components/library/library-client"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { libraryParamsCache } from "@/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"

export const dynamic = "force-dynamic"
// Note: revalidate removed - halaman ini menggunakan dynamic clientId dari searchParams.
// ISR dengan dynamic params akan menyebabkan cache contamination.
// Biarkan force-dynamic agar selalu fetch data real-time per client.

export const metadata: Metadata = {
  title: "Brand Media Assets",
  description: "Gudang penyimpanan aset media resmi, foto produk resolusi tinggi, dan materi promosi brand Anda.",
}

export default async function ClientAssetsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { clientId: parsedClientId } = libraryParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)

  return (
    <Suspense
      fallback={<div className="p-10 animate-pulse text-muted-foreground text-sm">Memuat aset media brand...</div>}
    >
      <DashboardPrefetcher clientId={clientId}>
        <LibraryClient />
      </DashboardPrefetcher>
    </Suspense>
  )
}
