import { Suspense } from "react"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { socialQueries } from "@/features/social-accounts/api/queries"
import { scheduledPostQueries } from "@/features/scheduled-posts/api/queries"
import { ErpDashboardClient } from "./erp-client"

export const dynamic = "force-dynamic"

export default async function AdminErpPage() {
  const queryClient = getQueryClient()

  // Server-side prefetching agar `useSuspenseQuery` di client menemukan data
  // di cache dan tidak memicu Server Action saat render (fetch waterfall +
  // "Cannot update Router while rendering a different component").
  await queryClient.prefetchQuery(socialQueries.listClientsWithChannels())
  await queryClient.prefetchQuery(scheduledPostQueries.listAll())

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-12 text-center animate-pulse">
            <div className="w-12 h-12 rounded-full bg-muted mb-4" />
            <div className="h-6 w-48 bg-muted rounded mb-2" />
            <div className="h-4 w-32 bg-muted/50 rounded" />
          </div>
        }
      >
        <ErpDashboardClient />
      </Suspense>
    </HydrationBoundary>
  )
}
