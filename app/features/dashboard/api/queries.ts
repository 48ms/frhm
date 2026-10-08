import { queryOptions } from "@tanstack/react-query"
import { getDashboardProfileWithMetrics, getClients } from "./service"

export const dashboardKeys = {
  all: ["dashboard"] as const,
  profile: (clientId: string) => [...dashboardKeys.all, "profile", clientId] as const,
  clients: () => [...dashboardKeys.all, "clients"] as const,
}

export const dashboardQueries = {
  /** Query untuk mendapatkan metrik dasbor faktual per client */
  profile: (clientId: string) =>
    queryOptions({
      queryKey: dashboardKeys.profile(clientId),
      queryFn: () => getDashboardProfileWithMetrics(clientId),
      // Hindari refetch agresif untuk dasbor yang mungkin data statis hariannya di-cache
      staleTime: 5 * 60 * 1000,
    }),

  /** Daftar seluruh client workspace (untuk halaman /admin/clients) */
  clients: () =>
    queryOptions({
      queryKey: dashboardKeys.clients(),
      queryFn: () => getClients(),
    }),
}
