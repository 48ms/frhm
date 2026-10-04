import { queryOptions } from '@tanstack/react-query'
import { listAssets } from './service'
import type { AssetListFilters } from './types'

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: AssetListFilters) => [...assetKeys.lists(), filters] as const,
}

export function assetListOptions(filters: AssetListFilters) {
  return queryOptions({
    queryKey: assetKeys.list(filters),
    queryFn: () => listAssets(filters),
  })
}
