import { queryOptions, mutationOptions } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query-client'
import {
  fetchMetrics,
  fetchSummaries,
  fetchCampaigns,
  generateInsight,
  updateMetric,
  updateSummaryNotes,
} from './service'

export const analyticsKeys = {
  all: ['analytics'] as const,
  posts: (clientId: string) => [...analyticsKeys.all, 'posts', clientId] as const,
  summaries: (clientId: string) => [...analyticsKeys.all, 'summaries', clientId] as const,
  campaigns: (clientId: string) => [...analyticsKeys.all, 'campaigns', clientId] as const,
}

export function analyticsPostsQueryOptions(clientId: string) {
  return queryOptions({
    queryKey: analyticsKeys.posts(clientId),
    queryFn: () => fetchMetrics(clientId),
    staleTime: 60 * 1000,
  })
}

export function analyticsSummariesQueryOptions(clientId: string) {
  return queryOptions({
    queryKey: analyticsKeys.summaries(clientId),
    queryFn: () => fetchSummaries(clientId),
    staleTime: 60 * 1000,
  })
}

export function analyticsCampaignsQueryOptions(clientId: string) {
  return queryOptions({
    queryKey: analyticsKeys.campaigns(clientId),
    queryFn: () => fetchCampaigns(clientId),
    staleTime: 5 * 60 * 1000,
  })
}

export function invalidateAnalytics() {
  getQueryClient().invalidateQueries({ queryKey: analyticsKeys.all })
}

export const generateInsightMutation = mutationOptions({
  mutationFn: generateInsight,
})

export const updateMetricMutation = mutationOptions({
  mutationFn: updateMetric,
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: analyticsKeys.all })
  },
})

export const updateSummaryNotesMutation = mutationOptions({
  mutationFn: updateSummaryNotes,
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: analyticsKeys.all })
  },
})
