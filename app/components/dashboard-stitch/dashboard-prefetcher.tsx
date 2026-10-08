import { getQueryClient } from "@/lib/query-client"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { socialQueries } from "@/features/social-accounts/api/queries"
import { dashboardQueries } from "@/features/dashboard/api/queries"
import { campaignQueries } from "@/features/campaigns/api/queries"
import { contentProductionQueries } from "@/features/content-production/api/queries"
import { erpQueries } from "@/features/erp/api/queries"

interface DashboardPrefetcherProps {
  clientId: string
  children: React.ReactNode
}

export async function DashboardPrefetcher({ clientId, children }: DashboardPrefetcherProps) {
  const queryClient = getQueryClient()

  // Prefetch everything in parallel
  await Promise.all([
    queryClient.prefetchQuery(socialQueries.listClientsWithChannels()),
    queryClient.prefetchQuery(dashboardQueries.profile(clientId)),
    queryClient.prefetchQuery(campaignQueries.listByClient(clientId)),
    queryClient.prefetchQuery(contentProductionQueries.listByClient(clientId)),
    queryClient.prefetchQuery(erpQueries.listBudgetsByClient(clientId)),
    queryClient.prefetchQuery(erpQueries.listKOLsByClient(clientId)),
    queryClient.prefetchQuery(erpQueries.listExpensesByClient(clientId)),
    queryClient.prefetchQuery(erpQueries.listAdSpendByClient(clientId)),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  )
}
