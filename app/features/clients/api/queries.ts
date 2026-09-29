import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@/lib/supabase/client'
import { fetchClients, fetchClientById } from './service'
import type { ClientsFilterParams } from './types'

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  list: (params: ClientsFilterParams) => [...clientKeys.lists(), params] as const,
  details: () => [...clientKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientKeys.details(), id] as const,
}

export function clientsListQueryOptions(
  params: ClientsFilterParams = {},
  customSupabase?: SupabaseClient
) {
  return queryOptions({
    queryKey: clientKeys.list(params),
    queryFn: () => {
      const supabase = customSupabase ?? createClient()
      return fetchClients(supabase, params)
    },
    staleTime: 30 * 1000,
  })
}

export function clientDetailQueryOptions(
  id: string,
  customSupabase?: SupabaseClient
) {
  return queryOptions({
    queryKey: clientKeys.detail(id),
    queryFn: () => {
      const supabase = customSupabase ?? createClient()
      return fetchClientById(supabase, id)
    },
    staleTime: 60 * 1000,
  })
}
