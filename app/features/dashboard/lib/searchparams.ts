import { createSearchParamsCache, parseAsString } from "nuqs/server"

export const dashboardSearchParams = {
  // Parser nuqs standar untuk mendapatkan clientId dari URL
  // Jika tidak ada di URL, Frahma akan menggunakan UUID Shell Reps secara default (11111111-1111-1111-1111-111111111111)
  clientId: parseAsString.withDefault("11111111-1111-1111-1111-111111111111")
}

export const searchParamsCache = createSearchParamsCache(dashboardSearchParams)
