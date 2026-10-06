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

  // 1. Prefetch list clients
  await queryClient.prefetchQuery(socialQueries.listClientsWithChannels())

  // 2. Prefetch dashboard profile
  await queryClient.prefetchQuery(dashboardQueries.profile(clientId))

  // 3. Prefetch campaigns & operational data
  await queryClient.prefetchQuery(campaignQueries.listByClient(clientId))
  await queryClient.prefetchQuery(contentProductionQueries.listByClient(clientId))
  await queryClient.prefetchQuery(erpQueries.listBudgetsByClient(clientId))
  await queryClient.prefetchQuery(erpQueries.listKOLsByClient(clientId))
  await queryClient.prefetchQuery(erpQueries.listExpensesByClient(clientId))
  await queryClient.prefetchQuery(erpQueries.listAdSpendByClient(clientId))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  )
}
