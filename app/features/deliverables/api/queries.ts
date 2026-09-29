import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { fetchDeliverables, fetchDeliverableById } from './service'
import type { DeliverablesFilterParams } from './types'
import type { SupabaseClient } from '@/lib/supabase/client'

export const deliverableKeys = {
  all: ['deliverables'] as const,
  lists: () => [...deliverableKeys.all, 'list'] as const,
  list: (params: DeliverablesFilterParams) =>
    [...deliverableKeys.lists(), params] as const,
  details: () => [...deliverableKeys.all, 'detail'] as const,
  detail: (id: string) => [...deliverableKeys.details(), id] as const,
}

export function deliverablesListQueryOptions(
  params: DeliverablesFilterParams = {},
  customSupabase?: SupabaseClient
) {
  // Stable query key: only include fields that have actual values, so the
  // server-prefetched cache entry matches the client lookup (avoids mismatch
  // between an empty {} key and a fully-populated client key).
  const stableKey = [
    'deliverables',
    'list',
    params.status,
    params.type,
    params.clientId,
    params.page,
    params.pageSize,
    params.search,
  ]

  return queryOptions({
    queryKey: stableKey,
    queryFn: () => {
      const supabase = customSupabase ?? createClient()
      return fetchDeliverables(supabase, params)
    },
    staleTime: 60 * 1000,
  })
}

export function deliverableDetailQueryOptions(
  id: string,
  customSupabase?: SupabaseClient
) {
  return queryOptions({
    queryKey: deliverableKeys.detail(id),
    queryFn: () => {
      const supabase = customSupabase ?? createClient()
      return fetchDeliverableById(supabase, id)
    },
    staleTime: 60 * 1000,
  })
}
