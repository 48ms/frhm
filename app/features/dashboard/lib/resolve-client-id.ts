/**
 * Server-side ClientId Resolver.
 *
 * Mengatasi masalah Sentinel UUID & Zero-State pada multi-tenant SaaS.
 * - Jika tidak ada client sama sekali di DB → redirect ke /admin/clients?onboarding=true (SaaS First-Run Onboarding).
 * - Jika URL membawa clientId yang valid dalam DB → kembalikan clientId tersebut.
 * - Jika URL membawa clientId invalid / kosong → kembalikan client pertama yang sah.
 *
 * Digunakan oleh page.tsx (App Router) melalui searchParamsCache.
 */
import { getClientsWithChannels } from "@/features/social-accounts/api/service"
import { redirect } from "next/navigation"
import { cache } from "react"

const getCachedClientsWithChannels = cache(async () => {
  return await getClientsWithChannels()
})

/**
 * Resolve clientId dari URL search params.
 * - Jika valid (non-empty & terdaftar) → kembalikan clientId.
 * - Jika tidak ada client sama sekali → redirect ke /admin/clients?onboarding=true (menghindari 404).
 * - Jika kosong atau ID invalid → kembalikan client pertama yang sah dari DB.
 */
export async function resolveClientId(clientIdFromUrl: string | null | undefined): Promise<string> {
  const clients = await getCachedClientsWithChannels()

  // Skenario Zero-Data: Jangan melempar 404! Arahkan admin secara terarah ke pembuatan klien pertama.
  if (!clients || clients.length === 0) {
    redirect("/admin/clients?onboarding=true")
  }

  // Jika URL membawa clientId yang cocok dengan salah satu klien aktif
  if (clientIdFromUrl && clientIdFromUrl.trim() !== "") {
    const matched = clients.find((c) => c.id === clientIdFromUrl)
    if (matched) {
      return matched.id
    }
  }

  // Fallback ke klien sah pertama di database
  return clients[0].id
}

