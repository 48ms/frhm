import { cache } from "react"
import { getQueryClient } from "@/lib/query-client"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { socialQueries } from "@/features/social-accounts/api/queries"
import { dashboardQueries } from "@/features/dashboard/api/queries"
import { campaignQueries } from "@/features/campaigns/api/queries"
import { contentProductionQueries } from "@/features/content-production/api/queries"
import { erpQueries } from "@/features/erp/api/queries"
import { scheduledPostQueries } from "@/features/scheduled-posts/api/queries"
import { deliverableQueries } from "@/features/deliverables/api/queries"
import { analyticsQueries } from "@/features/analytics/api/queries"

interface DashboardPrefetcherProps {
  clientId: string
  children: React.ReactNode
}

/**
 * PERF FIX: Dashboard memakai 5 Parallel Route slots (@hero, @kpis, @chart,
 * @pipeline, @hub), masing-masing membungkus kontennya dengan
 * <DashboardPrefetcher>. Tanpa deduplikasi, prefetch 8 query dijalankan
 * 5× (40 request redundant per page-load) dan memperlambat TTFB.
 *
 * `React.cache()` mendeduplikasi pemanggilan dalam SATU request render:
 * prefetch + dehydrate dieksekusi sekali per clientId, hasilnya dibagi ke
 * semua slot. Karena slot dirender paralel dalam request yang sama, cache()
 * menjamin satu eksekusi.
 */
const prefetchDashboardState = cache(async (clientId: string) => {
  const queryClient = getQueryClient()

  await Promise.all([
    queryClient.prefetchQuery(socialQueries.listClientsWithChannels()),
    queryClient.prefetchQuery(dashboardQueries.profile(clientId)),
    queryClient.prefetchQuery(campaignQueries.listByClient(clientId)),
    queryClient.prefetchQuery(contentProductionQueries.listByClient(clientId)),
    queryClient.prefetchQuery(erpQueries.listBudgetsByClient(clientId)),
    queryClient.prefetchQuery(erpQueries.listKOLsByClient(clientId)),
    queryClient.prefetchQuery(erpQueries.listExpensesByClient(clientId)),
    queryClient.prefetchQuery(erpQueries.listAdSpendByClient(clientId)),
    queryClient.prefetchQuery(scheduledPostQueries.listByClient(clientId)),
    queryClient.prefetchQuery(deliverableQueries.listByClient(clientId)),
    queryClient.prefetchQuery(analyticsQueries.listLatestPrediction(clientId)),
  ])

  return dehydrate(queryClient)
})

export async function DashboardPrefetcher({ clientId, children }: DashboardPrefetcherProps) {
  const state = await prefetchDashboardState(clientId)

  return (
    <HydrationBoundary state={state}>
      {children}
    </HydrationBoundary>
  )
}
