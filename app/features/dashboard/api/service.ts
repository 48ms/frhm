'use server'

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import type { DashboardProfile } from "./types"

/**
 * Service Layer untuk Dashboard
 * Mengambil data analitik dan profil klien secara faktual dari PostgreSQL
 */

export async function createNewClient(input: {
  name: string
  contact_email?: string
  contact_phone?: string
  telegram_chat_id?: string
  niche?: string
}): Promise<{ id: string; name: string }> {
  const supabase = await createClient()

  // 1. Insert ke clients (telegram_chat_id punya kolom asli, niche disimpan di brand_profile.niche)
  const { data: clientData, error: clientErr } = await supabase
    .from("clients")
    .insert({
      name: input.name,
      contact_email: input.contact_email || null,
      contact_phone: input.contact_phone || null,
      telegram_chat_id: input.telegram_chat_id || null,
      brand_profile: input.niche ? { niche: input.niche } : undefined,
    })
    .select("id, name")
    .single()

  if (clientErr || !clientData) {
    logger.error("createNewClient error", { error: clientErr })
    throw new Error(clientErr?.message || "Gagal membuat klien baru")
  }

  // 2. Setup profil analitik default
  const { error: profileErr } = await supabase
    .from("dashboard_profiles")
    .insert({
      client_id: clientData.id,
      velocity: 0,
      peak_value: "0%",
      insights: [],
    })

  if (profileErr) {
    logger.warn("createNewClient profile error", { error: profileErr })
    // Non-fatal, lanjutkan
  }

  return clientData
}

export async function getDashboardProfile(clientId: string): Promise<DashboardProfile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("dashboard_profiles")
    .select("*")
    .eq("client_id", clientId)
    .single()
    
  // Catatan faktual: service ini dipanggil dari `useSuspenseQuery` saat render
  // (lihat components/dashboard-stitch/dashboard-data.ts). Jika kita `throw`,
  // React Query akan me-reject promise saat render dan memicu warning
  // "Cannot update a component (Router) while rendering". Karena itu kita
  // degrade gracefully: kembalikan null agar konsumen memakai fallback profile.
  if (error) {
    if (error.code === 'PGRST116') return null // Not found (belum ada row)
    // Error lain (mis. JWT/network) juga tidak boleh melempar dari render.
    logger.error("getDashboardProfile failed", { error, clientId })
    return null
  }

  return data as DashboardProfile
}
