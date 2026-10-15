import { Suspense } from "react"
import { PageContainer } from "@/components/layout/page-container"
import { ComposerClient } from "./composer-client"
import { DashboardPrefetcher } from "@/components/dashboard-stitch/dashboard-prefetcher"
import { searchParamsCache } from "@/lib/searchparams"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Composer | Frahma",
  description: "Create and publish content across multiple platforms simultaneously.",
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
