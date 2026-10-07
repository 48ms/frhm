import { useQuery } from "@tanstack/react-query"
import { analyticsQueries } from "./queries"
import type { AnalyticsPrediction } from "./service"

export function useLatestPrediction(clientId: string) {
  const { data, isPending } = useQuery(analyticsQueries.listLatestPrediction(clientId))
  return {
    data: (data ?? null) as AnalyticsPrediction | null,
    isPending,
  }
}
