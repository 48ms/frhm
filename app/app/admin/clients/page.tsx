import { Suspense } from 'react'
import type { SearchParams } from 'nuqs/server'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query-client'
import { createClient } from '@/lib/supabase/server'
import { PageContainer } from '@/components/layout/page-container'
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton'
import { clientsListQueryOptions } from '@/features/clients/api/queries'
import { clientSearchParamsCache } from '@/features/clients/lib/searchparams'
import { ClientListing, ClientHeaderAction } from '@/features/clients/components'

export const dynamic = 'force-dynamic'

interface AdminClientsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function AdminClientsPage({ searchParams }: AdminClientsPageProps) {
  const queryClient = getQueryClient()
  const supabase = await createClient()

  // Parse search params on server using nuqs
  const parsed = clientSearchParamsCache.parse(await searchParams)

  // Server prefetching with TanStack Query (prevents client loading flash).
  // The param object MUST match ClientListing's exactly (same defaults:
  // search '', status 'all', sort []) or the cache key differs and the
  // prefetch is thrown away.
  void queryClient.prefetchQuery(
    clientsListQueryOptions(
      {
        page: parsed.page,
        perPage: parsed.perPage,
        search: parsed.q,
        status: parsed.status,
        sort: parsed.sort ?? [],
      },
      supabase
    )
  )

  return (
    <PageContainer
      pageTitle="Klien"
      pageDescription="Daftar dan manajemen seluruh brand klien yang sedang dikerjakan"
      pageHeaderAction={<ClientHeaderAction />}
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<DataTableSkeleton columnCount={5} rowCount={8} />}>
          <ClientListing />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  )
}
