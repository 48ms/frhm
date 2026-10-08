/**
 * Server-side ClientId Resolver.
 *
 * Mengatasi masalah Sentinel UUID (bad practice multi-tenant SaaS).
 * Jika URL tidak membawa clientId, resolver ini mengambil
 * client SAH pertama dari DB — bukan UUID dummy "1111...".
 *
 * Digunakan oleh page.tsx (App Router) melalui searchParamsCache.
 *
 * FIX (18 Okt 2026): Sekarang fungsi ini ME-THROW 404 jika tidak ada
 * klien yang valid, alih-alih mengembalikan null, sehingga halaman
 * admin tetap aman (tidak render client kosong).
 */
import { getClientsWithChannels } from "@/features/social-accounts/api/service"
import { notFound } from "next/navigation"

/**
 * Resolve clientId dari URL search params.
 * - Jika valid (non-empty) → kembalikan apa adanya (middleware sudah cek aksesnya).
 * - Jika kosong → kembalikan client pertama yang SAH dari DB.
 * - Jika tidak ada client sama sekali → throw 404 (sistem belum siap).
 */
export async function resolveClientId(clientIdFromUrl: string | null | undefined): Promise<string> {
  if (clientIdFromUrl && clientIdFromUrl.trim() !== "") {
    return clientIdFromUrl
  }

  const clients = await getClientsWithChannels()
  
  if (!clients || clients.length === 0) {
    // Tidak ada klien yang tersambung -> arahkan ke error 404
    // Alih-alih melempar data kosong yang mungkin memicu bug
    notFound()
  }

  return clients[0].id
}

