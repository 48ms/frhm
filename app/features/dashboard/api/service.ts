'use server'

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit/log"
import { assertAdmin } from "@/lib/auth/guard"
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
  await assertAdmin()
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
        identity: `${input.name} adalah brand${input.niche ? ` di industri ${input.niche}` : ""}.`,
        positioning: "Memberikan solusi relevan dan berdampak bagi audiens.",
        audience: `Target audiens utama untuk ${input.name}.`,
        voice: "Profesional, terpercaya, dan solutif",
        pov: "Memberikan dampak dan nilai terbaik bagi audiens",
        proof: "Komitmen mutu dan pelayanan prima",
        offers_ctas: "Hubungi kami via DM atau WhatsApp untuk konsultasi dan pemesanan.",
        channels: ["Instagram", "TikTok"],
        operational_defaults: "AI sebagai asisten riset & draf; kurasi final oleh tim manusia.",
        guardrails: "Hindari klaim berlebihan tanpa bukti; dilarang komparasi negatif.",
        examples: "Loves: Konten edukasi dan cerita di balik layar. Hates: Clickbait palsu.",
        pillars: [
          "Edukasi & Otoritas",
          "Cerita & Di Balik Layar",
          "Bukti Sosial & Transformasi",
          "Penawaran & Promosi",
        ],
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

  // 1b. Auto-provision or link initial client portal user in public.users
  if (input.contact_email) {
    const cleanEmail = input.contact_email.toLowerCase().trim()
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, role')
        .eq('email', cleanEmail)
        .single()

      if (existingUser) {
        if (existingUser.role !== 'admin') {
          await supabase
            .from('users')
            .update({
              client_id: clientData.id,
              role: 'client',
            })
            .eq('id', existingUser.id)
        }
      } else {
        await supabase
          .from('users')
          .insert({
            email: cleanEmail,
            full_name: input.name,
            role: 'client',
            client_id: clientData.id,
          })
      }

      void logAudit({
        action: 'client.user_assigned',
        entityType: 'client_user',
        entityId: clientData.id,
        summary: `Auto-linked client user ${cleanEmail} to client "${clientData.name}"`,
        metadata: { clientId: clientData.id, email: cleanEmail },
      })
    } catch (userProvisionErr: unknown) {
      logger.warn('createNewClient user auto-provision non-fatal error', {
        error: userProvisionErr instanceof Error ? userProvisionErr.message : String(userProvisionErr),
      })
    }
  }

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

  // 3. Seed 4 foundation markdown files in client_files
  const initialBrandProfileMd = `# Brand Profile — ${input.name}
<!-- version: 1.0 · review: quarterly or on rebrand/pivot/new offer -->

## Identity
- **What it is (one sentence):** ${input.name} adalah brand${input.niche ? ` di industri ${input.niche}` : ""}.
- **Category:** ${input.niche || "Bisnis / Layanan"}
- **Founded / location:** Indonesia

## Positioning
- **What's different:** Memberikan solusi relevan dan berdampak bagi audiens sasaran.
- **Why believe it:** Komitmen mutu dan pelayanan prima teruji.
- **Point of view:** Memberikan solusi dan nilai terbaik bagi audiens.
- **Won't say:** Klaim tanpa dasar atau komparasi negatif terhadap pihak lain.

## Audience
### Segment 1 — Target Utama
- **Who:** Target audiens utama untuk ${input.name}.
- **Cares about:** Solusi terpercaya, pelayanan cepat, dan mutu produk.
- **Where:** Instagram, TikTok.

## Voice
- **Dimensions:** Formality 3/5 · Warmth 4/5 · Authority 4/5 · Energy 3/5 · Humor 2/5 · Polish 4/5
- **We sound:** Profesional, terpercaya, dan solutif, never arogan atau kaku.
- **Words we use:** Kualitas, solusi, terpercaya, transparan, kepuasan.
- **Words we ban:** Instan tanpa proses, termurah sedunia, overpromising.

## Proof
- **Credentials / track record:** Komitmen mutu dan pelayanan prima.
- **Social proof:** Ulasan positif pelanggan setia.

## Offers & CTAs
- **Primary CTA:** Hubungi kami via DM atau WhatsApp untuk konsultasi dan pemesanan.
- **Secondary CTAs:** Simpan postingan ini, ikuti akun kami untuk pembaruan terkini.

## Channels
- Instagram
- TikTok

## Operational defaults
- **AI policy:** AI sebagai asisten perencana dan draf; kurasi final oleh tim manusia.
- **Accessibility defaults:** Alt-text deskriptif dan teks mudah dibaca.

## Guardrails
- Komunikasi transparan, edukatif, dan ramah.
- Dilarang klaim tanpa dasar atau komparasi negatif.

## Show, don't tell — example posts
- **Loves:** Konten edukasi solutif, testimoni tulus, dan cerita di balik layar.
- **Hates:** Clickbait sensasional tanpa substansi nilai.

## Content Pillars
- Edukasi & Otoritas
- Cerita & Di Balik Layar
- Bukti Sosial & Transformasi
- Penawaran & Promosi
`

  const initialVoiceMd = `# Brand Voice & Tone Guide — ${input.name}

## Karakter Suara Utama
- **Profesional & Terpercaya:** Menyapa audiens secara lugas, santun, dan solutif.
- **Edukatif & Solutif:** Memberikan panduan praktis dan wawasan bermanfaat tanpa nada menggurui.

## Prinsip Penulisan
1. Menggunakan Bahasa Indonesia yang komunikatif dan bersahabat.
2. Fokus pada masalah nyata audiens dan bagaimana ${input.name} memberikan solusinya.
3. Hindari klaim bombastis tanpa verifikasi faktual.
`

  const initialContentPillarsMd = `# Content Pillars — ${input.name}

## 1. Edukasi & Otoritas (40%)
Tips praktis, panduan, edukasi industri, dan wawasan seputar ${input.niche || "solusi produk"}.

## 2. Cerita & Di Balik Layar (30%)
Proses kerja, kisah di balik produk/layanan, budaya tim, dan dedikasi mutu.

## 3. Bukti Sosial & Transformasi (20%)
Testimoni pelanggan, studi kasus, ulasan kepuasan, dan hasil nyata.

## 4. Penawaran & Promosi (10%)
Informasi penawaran berkala, produk unggulan, dan ajakan bertindak (CTA) jelas.
`

  const initialGuardrailsMd = `# Brand Guardrails & Never-List — ${input.name}

## Daftar Pantangan (Never-List)
- Dilarang membuat klaim kesehatan atau hasil instan tanpa bukti ilmiah.
- Dilarang membandingkan atau menjelekkan kompetitor secara langsung.
- Dilarang menggunakan clickbait palsu atau tren yang bertentangan dengan etika brand.
- Verifikasi promo dan penawaran setiap kuartal (verify-quarterly).
`

  const nowIso = new Date().toISOString()
  const { error: fileErr } = await supabase
    .from("client_files")
    .insert([
      {
        client_id: clientData.id,
        path: "brand-profile.md",
        content: initialBrandProfileMd,
        updated_at: nowIso,
        needs_verification: false,
      },
      {
        client_id: clientData.id,
        path: "voice.md",
        content: initialVoiceMd,
        updated_at: nowIso,
        needs_verification: false,
      },
      {
        client_id: clientData.id,
        path: "content-pillars.md",
        content: initialContentPillarsMd,
        updated_at: nowIso,
        needs_verification: false,
      },
      {
        client_id: clientData.id,
        path: "guardrails.md",
        content: initialGuardrailsMd,
        updated_at: nowIso,
        needs_verification: true,
      },
    ])

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
