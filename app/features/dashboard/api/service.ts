'use server'

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import type { DashboardProfile } from "./types"

/**
 * Service Layer untuk Dashboard
 * Mengambil data analitik dan profil klien secara faktual dari PostgreSQL
 */

export async function getClients(): Promise<Array<{ id: string; name: string; contact_email: string | null }>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("clients")
    .select("id, name, contact_email")
    .order("name")

  if (error) {
    logger.error("getClients error", { error })
    throw new Error(error.message)
  }

  return data ?? []
}

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

/**
 * Serializer: mengubah `metrics` JSONB mentah menjadi format `DashboardMetric[]`
 * yang dibaca UI (kpi-grid).
 *
 * FAKTA DB (diverifikasi langsung): kolom `dashboard_profiles.metrics` berisi
 * OBJECT mentah, contoh:
 *   { total_reach: 10261, total_views: 19201, audience_size: 10261,
 *     engagement_rate: 3.7, total_engagement: 379 }
 *
 * Sebelum serializer ini, UI membaca `metrics[0].value` -> undefined (object
 * bukan array) sehingga KPI card selalu jatuh ke fallback "0". Serializer ini
 * hanya melakukan mapping read-only; struktur DB tidak diubah.
 */
function serializeMetrics(
  raw: unknown
): { label: string; value: string; delta: string; trend: "up" | "down" | "neutral"; spark: number[] }[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return []

  const m = raw as Record<string, number | string | undefined>

  const num = (v: number | string | undefined, suffix = ""): string => {
    if (typeof v === "number") return v.toLocaleString("en-US") + suffix
    if (typeof v === "string" && v !== "") return v + suffix
    return "0"
  }

  return [
    { label: "Total Reach", value: num(m.total_reach ?? m.audience_size), delta: "N/A", trend: "neutral", spark: [0, 0, 0, 0, 0, 0] },
    { label: "Engagement Rate", value: num(m.engagement_rate, "%"), delta: "N/A", trend: "neutral", spark: [0, 0, 0, 0, 0, 0] },
    { label: "Total Engagement", value: num(m.total_engagement), delta: "N/A", trend: "neutral", spark: [0, 0, 0, 0, 0, 0] },
  ]
}

/**
 * Mengambil dashboard profile + mengserialisasi metrics ke format UI.
 * Mengembalikan null (bukan throw) jika belum ada row — konsumen memakai fallback.
 */
export async function getDashboardProfileWithMetrics(clientId: string): Promise<DashboardProfile | null> {
  const profile = await getDashboardProfile(clientId)
  if (!profile) return null
  // DB metrics bisa OBJECT (raw Ayrshare) atau ARRAY (sudah di-cache oleh sinkronisasi).
  // Hanya serialize jika belum array.
  const metrics = Array.isArray(profile.metrics)
    ? profile.metrics
    : serializeMetrics(profile.metrics as unknown)
  return { ...profile, metrics }
}
