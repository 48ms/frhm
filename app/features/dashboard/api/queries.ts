import { queryOptions } from "@tanstack/react-query"
import { getDashboardProfile } from "./service"

export const dashboardKeys = {
  all: ["dashboard"] as const,
  profile: (clientId: string) => [...dashboardKeys.all, "profile", clientId] as const,
}

export const dashboardQueries = {
  /** Query untuk mendapatkan metrik dasbor faktual per client */
  profile: (clientId: string) =>
    queryOptions({
      queryKey: dashboardKeys.profile(clientId),
      queryFn: () => getDashboardProfile(clientId),
      // Hindari refetch agresif untuk dasbor yang mungkin data statis hariannya di-cache
      staleTime: 5 * 60 * 1000,
    }),
}
