import { queryOptions, mutationOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getQueryClient } from '@/lib/query-client'
import { fetchProductions, deleteProduction } from './service'

export const productionKeys = {
  all: ['productions'] as const,
  lists: () => [...productionKeys.all, 'list'] as const,
  list: (clientId: string) => [...productionKeys.lists(), clientId] as const,
}

export function productionsQueryOptions(clientId: string) {
  return queryOptions({
    queryKey: productionKeys.list(clientId),
    queryFn: () => fetchProductions(createClient(), clientId),
    enabled: !!clientId,
    staleTime: 60 * 1000,
  })
}

export const deleteProductionMutation = mutationOptions({
  mutationFn: (id: string) => deleteProduction(createClient(), id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: productionKeys.all })
  },
})

export function invalidateProductions(clientId: string) {
  getQueryClient().invalidateQueries({ queryKey: productionKeys.list(clientId) })
}
