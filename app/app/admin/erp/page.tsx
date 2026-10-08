import { Suspense } from "react"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { socialQueries } from "@/features/social-accounts/api/queries"
import { scheduledPostQueries } from "@/features/scheduled-posts/api/queries"
import { deliverableQueries } from "@/features/deliverables/api/queries"
import { searchParamsCache } from "@/features/dashboard/lib/searchparams"
import { ErpDashboardClient } from "./erp-client"

export const dynamic = "force-dynamic"

export default async function AdminErpPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Baca clientId aktif dari URL (sumber kebenaran yang sama dengan sidebar switcher).
  // Tanpa ini, prefetch memakai key `listAll()` sementara client membaca
  // `listByClient(clientId)` -> cache miss -> useSuspenseQuery suspend saat render
  // -> "Cannot update Router while rendering" (waterfall).
  const { clientId } = searchParamsCache.parse(await props.searchParams)
  const queryClient = getQueryClient()

  // Server-side prefetching agar `useSuspenseQuery` di client menemukan data
  // di cache dan tidak memicu Server Action saat render.
  await queryClient.prefetchQuery(socialQueries.listClientsWithChannels())
  await queryClient.prefetchQuery(scheduledPostQueries.listByClient(clientId))
  await queryClient.prefetchQuery(deliverableQueries.listByClient(clientId))

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
