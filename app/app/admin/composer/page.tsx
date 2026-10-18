import { Suspense } from "react"
import Link from "next/link"
import { PageContainer } from "@/components/layout/page-container"
import { ComposerClient } from "./composer-client"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"
import { Icons } from "@/components/icons"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Content Composer",
  description: "Buat dan publikasikan konten multi-platform secara simultan dalam satu alur kerja.",
}

export default async function ComposerPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { clientId: parsedClientId } = searchParamsCache.parse(await props.searchParams)
  const clientId = await resolveClientId(parsedClientId)

  return (
    <PageContainer
      pageTitle="Content Composer"
      pageDescription="Auto Posting Lebih Simpel. Masukkan 1 konten saja, lalu distribusikan ke berbagai platform."
      pageHeaderAction={
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/calendar${clientId ? `?clientId=${clientId}` : ""}`}
            className="admin-pill admin-pill-secondary flex items-center gap-2 text-xs font-semibold py-2 px-3.5 border border-border/50 text-foreground hover:bg-card/90"
          >
            <Icons.calendar className="size-3.5 text-muted-foreground" />
            <span>Lihat Kalender Konten</span>
          </Link>
        </div>
      }
    >
      <Suspense
        fallback={<div className="p-10 animate-pulse text-muted-foreground">Memuat composer...</div>}
      >
        <DashboardPrefetcher clientId={clientId}>
          <ComposerClient />
        </DashboardPrefetcher>
      </Suspense>
    </PageContainer>
  )
}
