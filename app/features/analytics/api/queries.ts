import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getPostMetricsByClient,
  getAnalyticsSummariesByClient,
  getLatestPrediction,
  auditPerformanceAndIterate,
  getMultiAccountAnalytics,
  syncMultiAccountSocialData,
} from "./service"
import type { AuditPerformanceInput, SyncMultiAccountInput } from "./types"

export const analyticsKeys = {
  all: ["analytics"] as const,
  metricsByClient: (clientId: string) => [...analyticsKeys.all, "metrics", clientId] as const,
  summariesByClient: (clientId: string) => [...analyticsKeys.all, "summaries", clientId] as const,
  multiAccount: (clientId: string, period = "30d") =>
    [...analyticsKeys.all, "multi-account", clientId, period] as const,
}

export const analyticsQueries = {
  listMetricsByClient: (clientId: string) =>
    queryOptions({
      queryKey: analyticsKeys.metricsByClient(clientId),
      queryFn: () => getPostMetricsByClient(clientId),
      enabled: Boolean(clientId),
    }),
    
  listSummariesByClient: (clientId: string) =>
    queryOptions({
      queryKey: analyticsKeys.summariesByClient(clientId),
      queryFn: () => getAnalyticsSummariesByClient(clientId),
      enabled: Boolean(clientId),
    }),

  listLatestPrediction: (clientId: string) =>
    queryOptions({
      queryKey: [...analyticsKeys.all, "prediction", clientId],
      queryFn: () => getLatestPrediction(clientId),
      enabled: Boolean(clientId),
    }),

  multiAccount: (clientId: string, period = "30d") =>
    queryOptions({
      queryKey: analyticsKeys.multiAccount(clientId, period),
      queryFn: () => getMultiAccountAnalytics(clientId, period),
      enabled: Boolean(clientId),
    }),
}

export function useAuditPerformanceAndIterate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AuditPerformanceInput) => auditPerformanceAndIterate(input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({
        queryKey: analyticsKeys.summariesByClient(input.clientId),
      })
    },
  })
}

export function useSyncMultiAccountSocialData() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SyncMultiAccountInput) => syncMultiAccountSocialData(input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({
        queryKey: analyticsKeys.all,
      })
    },
  })
}
