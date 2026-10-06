import { PageContainer } from "@/components/layout/page-container"
import { ComposerClient } from "./composer-client"
import { getQueryClient } from "@/lib/query-client"
import { socialQueries } from "@/features/social-accounts/api/queries"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"

export const metadata = {
  title: "Composer | Frahma",
  description: "Create and publish content across multiple platforms simultaneously.",
}

export default async function ComposerPage() {
  const queryClient = getQueryClient()
  
  // Frahma Rule 3: Server Prefetching
  await queryClient.prefetchQuery(socialQueries.listClientsWithChannels())

  return (
    <PageContainer
      pageTitle="Content Composer"
      pageDescription="Auto Posting Lebih Simpel. Masukkan 1 konten saja, lalu distribusikan ke berbagai platform."
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ComposerClient />
      </HydrationBoundary>
    </PageContainer>
  )
}
