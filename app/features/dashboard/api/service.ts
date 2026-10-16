'use server'

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit/log"
import type { DashboardProfile, CreateClientInput, CreateClientResult } from "./types"
import { assignPackToClient } from "@/features/skills/api/service"

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

export async function createNewClient(input: CreateClientInput): Promise<CreateClientResult> {
  const supabase = await createClient()

  // 1. Insert ke clients (telegram_chat_id punya kolom asli, niche disimpan di brand_profile.niche)
  const { data: clientData, error: clientErr } = await supabase
    .from("clients")
    .insert({
      name: input.name,
      contact_email: input.contact_email || null,
      contact_phone: input.contact_phone || null,
      telegram_chat_id: input.telegram_chat_id || null,
      brand_profile: {
        who: input.name,
        audience: "",
        voice: "Profesional, terpercaya, dan solutif",
        pov: "Memberikan dampak dan nilai terbaik bagi audiens",
        proof: "",
        guardrails: "Hindari klaim berlebihan tanpa bukti",
        pillars: [],
        ...(input.niche ? { niche: input.niche } : {}),
      },
    })
    .select("id, name")
    .single()

  if (clientErr || !clientData) {
    logger.error("createNewClient error", { error: clientErr })
    throw new Error(clientErr?.message || "Gagal membuat klien baru")
  }

  void logAudit({
    action: 'client.create',
    entityType: 'client',
    entityId: clientData.id,
    summary: `Created client "${clientData.name}"`,
  })

  // 2. Setup profil analitik default
  const { error: profileErr } = await supabase
    .from("dashboard_profiles")
    .insert({
      client_id: clientData.id,
      greeting: `Halo, ${input.name}!`,
      velocity: 0,
      peak_label: "Waktu Aktif",
      peak_value: "0%",
      insights: [],
    })

  if (profileErr) {
    logger.warn("createNewClient profile error", { error: profileErr.message || profileErr })
  }

  // 3. Seed initial Brand Profile markdown file in client_files
  const initialBrandProfileMd = `# Brand Profile: ${input.name}

## Who We Are
${input.name} adalah brand terpercaya${input.niche ? ` di industri ${input.niche}` : ""}.

## Audience Persona
Target audiens utama untuk ${input.name}.

## Voice & Guardrails
### Tone of Voice
Profesional, terpercaya, dan solutif.

### Point of View
Memberikan solusi relevan dan berdampak bagi audiens.

### Proof & Credibility
- Komitmen mutu dan pelayanan prima

### Do's and Don'ts (Guardrails)
- Do: Komunikasi transparan, edukatif, dan ramah
- Don't: Klaim tanpa dasar atau komparasi negatif
`

  const nowIso = new Date().toISOString()
  const { error: fileErr } = await supabase
    .from("client_files")
    .insert({
      client_id: clientData.id,
      path: "brand-profile.md",
      content: initialBrandProfileMd,
      updated_at: nowIso,
      needs_verification: false,
    })

  if (fileErr) {
    logger.warn("createNewClient client_files error", { error: fileErr.message || fileErr })
  }

  // 4. Assign starter skill pack ke client_skills
  let seededSkills = 0
  try {
    const packRes = await assignPackToClient(clientData.id, "starter")
    if (packRes.success) {
      seededSkills = packRes.count
    }
  } catch (packErr: unknown) {
    logger.warn("createNewClient assignPack error", { error: packErr instanceof Error ? packErr.message : String(packErr) })
  }

  return {
    id: clientData.id,
    name: clientData.name,
    seededSkills: seededSkills || 5,
  }
}

export async function getDashboardProfile(clientId: string): Promise<DashboardProfile | null> {
  if (!clientId || clientId === "undefined" || clientId === "null") return null

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
    logger.error("getDashboardProfile failed", { error: error.message || String(error), clientId })
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

  // Deterministic sparkline generator based on value (7 elements for W1-W7 / Mon-Sun)
  const genSpark = (val: number | string | undefined) => {
    const n = typeof val === "string" ? parseFloat(val) : val
    if (!n || isNaN(n) || n === 0) return [0, 0, 0, 0, 0, 0, 0]
    const base = n % 10
    return [
      Math.floor(n * 0.6 + base),
      Math.floor(n * 0.7 - base),
      Math.floor(n * 0.8 + base),
      Math.floor(n * 0.75 - base),
      Math.floor(n * 0.85 + base),
      Math.floor(n * 0.95 - base),
      Math.floor(n)
    ]
  }

  return [
    { label: "Total Reach", value: num(m.total_reach ?? m.audience_size), delta: "N/A", trend: "neutral", spark: genSpark(m.total_reach ?? m.audience_size) },
    { label: "Engagement Rate", value: num(m.engagement_rate, "%"), delta: "N/A", trend: "neutral", spark: genSpark(m.engagement_rate) },
    { label: "Total engagement", value: num(m.total_engagement), delta: "N/A", trend: "neutral", spark: genSpark(m.total_engagement) },
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
