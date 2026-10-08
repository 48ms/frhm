import { createSearchParamsCache, parseAsString } from "nuqs/server"

/**
 * Parser nuqs standar untuk mendapatkan clientId dari URL.
 *
 * FIX TENANCY (wajib baca):
 * - Dulu default = UUID Sentinel "11111111-..." (dummy).
 * - Sekarang default = string kosong. Konsumen WAJIB resolve via
 *   `resolveClientId()` (server) atau `useActiveDashboard()` (client)
 *   yang akan jatuh ke client pertama yang SAH dari DB, bukan dummy.
 * - Alasan: Sentinel UUID adalah bad practice di multi-tenant SaaS —
 *   menimbulkan IDOR risk & data leak antar tenant.
 */
export const dashboardSearchParams = {
  clientId: parseAsString.withDefault("")
}

export const searchParamsCache = createSearchParamsCache(dashboardSearchParams)
