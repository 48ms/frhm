import { Suspense } from "react"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { socialQueries } from "@/features/social-accounts/api/queries"
import { ClientChannelsBoard } from "@/components/social-accounts/social-accounts-board"
import { PageContainer } from "@/components/layout/page-container"

export const dynamic = "force-dynamic"

export default async function SocialAccountsPage() {
  const queryClient = getQueryClient()
  
  // 1. Server-side data prefetching agar UX instan
  void queryClient.prefetchQuery(socialQueries.listClientsWithChannels())

  return (
    <PageContainer
      pageTitle="Social Accounts"
      pageDescription="Manage connected accounts, monitor data sync, and resolve access issues."
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center p-12 text-center animate-pulse">
            <div className="w-12 h-12 rounded-full bg-muted mb-4" />
            <div className="h-6 w-48 bg-muted rounded mb-2" />
            <div className="h-4 w-32 bg-muted/50 rounded" />
          </div>
        }>
          <ClientChannelsBoard />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  )
}
