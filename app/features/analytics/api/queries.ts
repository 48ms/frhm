import { queryOptions } from "@tanstack/react-query"
import {
  getPostMetricsByClient,
  getAnalyticsSummariesByClient,
  getLatestPrediction,
} from "./service"

export const analyticsKeys = {
  all: ["analytics"] as const,
  metricsByClient: (clientId: string) => [...analyticsKeys.all, "metrics", clientId] as const,
  summariesByClient: (clientId: string) => [...analyticsKeys.all, "summaries", clientId] as const,
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
}
