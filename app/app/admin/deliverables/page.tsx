import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query-client'
import { createClient } from '@/lib/supabase/server'
import { deliverablesListQueryOptions } from '@/features/deliverables/api/queries'
import { DeliverableListing } from '@/features/deliverables/components/deliverable-listing'
import { PageContainer } from '@/components/layout/page-container'
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton'

export default async function DeliverablesPage() {
  const queryClient = getQueryClient()
  const supabase = await createClient()

  // Prefetch with the same params the client will use on first load
  // (nuqs defaults page=1, pageSize=10) so the dehydrated cache key matches
  // the client's useSuspenseQuery lookup — prevents a hydration mismatch.
  void queryClient.prefetchQuery(deliverablesListQueryOptions({ page: 1, pageSize: 10 }, supabase))

  return (
    <PageContainer
      pageTitle="Deliverables"
      pageDescription="Daftar deliverable yang sedang dikerjakan untuk setiap klien"
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<DataTableSkeleton columnCount={4} rowCount={8} />}>
          <DeliverableListing />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  )
}