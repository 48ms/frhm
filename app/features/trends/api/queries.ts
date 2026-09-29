import { queryOptions } from '@tanstack/react-query'
import { fetchTrendRadar } from './service'
import type { TrendRadarFilter } from './types'

export const trendKeys = {
  all: ['trends'] as const,
  lists: () => [...trendKeys.all, 'list'] as const,
  list: (filter: TrendRadarFilter) => [...trendKeys.lists(), filter] as const,
}

export function trendRadarQueryOptions(filter: TrendRadarFilter) {
  return queryOptions({
    queryKey: trendKeys.list(filter),
    queryFn: () => fetchTrendRadar(filter),
    staleTime: 10 * 60 * 1000, // 10 minutes since trends are externally sourced
  })
}
