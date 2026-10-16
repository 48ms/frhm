'use server'

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit/log"
import { env } from "@/lib/env"
import { resolveProvider } from "@/lib/ai/server"
import { chatJson } from "@/lib/ai/providers"
import { BrandProfileSchema, type ClientWithChannels, type GenerateBrandProfileInput } from "./types"

/**
 * Service Layer untuk Social Accounts
 * 100% Supabase Auth & PostgreSQL RLS (sesuai aturan Frhm)
 */

/** Mengambil daftar semua klien beserta akun sosial (channels) mereka */
export async function getClientsWithChannels(): Promise<ClientWithChannels[]> {
  const supabase = await createClient()

  // PERF FIX: ketiga query independen (tidak saling bergantung) — jalankan
  // paralel via Promise.all alih-alih 3 round-trip sequential (waterfall).
  // Sebelumnya: T_total = T_clients + T_channels + T_profiles.
  // Sekarang:    T_total = max(T_clients, T_channels, T_profiles).
  const [clientsRes, channelsRes, profilesRes] = await Promise.all([
    supabase
      .from("clients")
      .select("*")
      .not("name", "ilike", "%Test Client%")
      .order('created_at', { ascending: false }),
    supabase
      .from("client_channels")
      .select("*"),
    supabase
      .from("dashboard_profiles")
      .select("client_id, metrics"),
  ])

  const { data: clients, error: clientsError } = clientsRes
  const { data: channels, error: channelsError } = channelsRes
  const { data: profiles } = profilesRes

  if (clientsError) {
    logger.error("getClientsWithChannels (clients) failed", { error: clientsError })
    return []
  }
  if (!clients) return []

  if (channelsError) {
    logger.error("getClientsWithChannels (channels) failed", { error: channelsError })
    return clients.map((client) => ({ ...client, channels: [] })) as ClientWithChannels[]
  }

  // PERF FIX: ganti .find()/.filter() di dalam loop (O(n×m)) dengan Map
  // lookup (O(n+m)). Penting saat jumlah klien & channel bertambah.
  const profileByClient = new Map<string, { audience_size: number }>()
  for (const p of profiles ?? []) {
    const metricsObj = p.metrics as Record<string, unknown> | undefined
    profileByClient.set(p.client_id, { audience_size: Number(metricsObj?.audience_size ?? 0) })
  }

  const channelsByClient = new Map<string, typeof channels>()
  for (const ch of channels ?? []) {
    const list = channelsByClient.get(ch.client_id)
    if (list) list.push(ch)
    else channelsByClient.set(ch.client_id, [ch])
  }

  return clients.map((client) => {
    const dashboardProfile = profileByClient.get(client.id)
    return {
      ...client,
      channels: channelsByClient.get(client.id) ?? [],
      dashboard_profile: dashboardProfile,
    }
  }) as ClientWithChannels[]
}

/** Menghapus koneksi akun (Disconnect) */
export async function disconnectChannel(channelId: string): Promise<void> {
  const supabase = await createClient()
  
  const { data: channel } = await supabase
    .from("client_channels")
    .select("client_id")
    .eq("id", channelId)
    .single()

  const { error } = await supabase
    .from("client_channels")
    .delete()
    .eq("id", channelId)

  if (error) throw new Error(error.message)

  void logAudit({
    action: 'social.disconnect',
    entityType: 'client_channel',
    entityId: channelId,
    clientId: channel?.client_id ?? null,
    summary: `Disconnected channel ${channelId}`,
  })
}

/** Menyinkronkan ulang akun (Refresh Data) via Bridge */
export async function syncChannel(channelId: string): Promise<void> {
  const supabase = await createClient()
  
  const { data: channel, error: channelError } = await supabase
    .from("client_channels")
    .select("client_id, platform")
    .eq("id", channelId)
    .single()

  if (channelError || !channel) {
    throw new Error(channelError?.message || "Channel not found")
  }

  const { data: clientData, error: clientError } = await supabase
    .from("clients")
    .select("ayrshare_profile_key")
    .eq("id", channel.client_id)
    .single()

  if (clientError || !clientData?.ayrshare_profile_key) {
    throw new Error("Ayrshare profile key not found for this client")
  }

  const apiKey = env.server.AYRSHARE_API_KEY
  if (!apiKey) {
    throw new Error("Ayrshare API key not configured")
  }

  const res = await fetch("https://app.ayrshare.com/api/profiles", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Profile-Key": clientData.ayrshare_profile_key
    }
  })

  if (!res.ok) {
    throw new Error(`Ayrshare API error: ${res.statusText}`)
  }

  const profiles = await res.json()
  const pData = profiles[channel.platform.toLowerCase()]

  if (pData) {
    const avatar_url = pData.picture || null
    const handle = pData.username || `${channel.platform} account`

    const { error: updateError } = await supabase
      .from("client_channels")
      .update({
        avatar_url,
        handle,
        status: "terhubung",
        updated_at: new Date().toISOString()
      })
      .eq("id", channelId)

    if (updateError) throw new Error(updateError.message)
    
    void logAudit({
      action: 'social.sync_success',
      entityType: 'client_channel',
      entityId: channelId,
      clientId: channel.client_id,
      summary: `Synced channel ${channelId}`,
    })
  } else {
    await supabase
      .from("client_channels")
      .update({
        status: "gagal",
        updated_at: new Date().toISOString()
      })
      .eq("id", channelId)
      
    void logAudit({
      action: 'social.sync_failed',
      entityType: 'client_channel',
      entityId: channelId,
      clientId: channel.client_id,
      summary: `Failed sync for channel ${channelId}`,
    })
    throw new Error(`Platform ${channel.platform} not found in Ayrshare profiles`)
  }
}

/** Render the BrandProfile JSON into the repo's canonical brand-profile.md shape. */
function brandProfileToMarkdown(profile: {
  who: string; audience: string; voice: string; pov: string
  proof: string; guardrails: string; pillars: string[]
}): string {
  const pillars = (profile.pillars ?? []).map((p) => `- ${p}`).join("\n")
  return `# Brand Profile

## Who We Are
${profile.who}

## Audience Persona
${profile.audience}

## Voice & Guardrails
### Tone of Voice
${profile.voice}

### Point of View
${profile.pov}

### Proof & Credibility
${profile.proof}

### Do's and Don'ts (Guardrails)
${profile.guardrails}

## Content Pillars
${pillars}
`
}

/** Update Brand Profile — writes BOTH the JSONB (Settings UI) and the markdown file (Copilot reads this). */
export async function updateBrandProfile(clientId: string, profile: any): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("clients")
    .update({ brand_profile: profile })
    .eq("id", clientId)

  if (error) throw new Error(error.message)

  void logAudit({
    action: 'brand.update',
    entityType: 'client',
    entityId: clientId,
    clientId,
    summary: `Updated brand profile for ${clientId}`,
  })

  const markdown = brandProfileToMarkdown(profile)
  const { error: fileError } = await supabase
    .from("client_files")
    .upsert(
      { client_id: clientId, path: "brand-profile.md", content: markdown, updated_at: new Date().toISOString() },
      { onConflict: "client_id,path" }
    )

  if (fileError) throw new Error(fileError.message)
}

export async function generateBrandProfile(input: GenerateBrandProfileInput) {
  try {
    const supabase = await createClient()
    const provider = await resolveProvider(supabase)

    if (!provider) {
      return { error: "AI Provider belum dikonfigurasi. Hubungi Admin." }
    }

    const object = await chatJson<{
      who: string; audience: string; voice: string; pov: string
      proof: string; guardrails: string; pillars: string[]
    }>(provider, "Kamu adalah Senior Brand Strategist yang mengekstrak Brand DNA dari materi mentah. Output JSON saja.", [
      {
        role: "user",
        content: `Materi mentah:
${input.rawMaterial}

Industri (opsional): ${input.industry || "Tidak dispesifikasikan"}

Instruksi Ekstraksi — hasilkan JSON dengan field berikut:
1. who: Penjelasan ringkas identitas bisnis (1 kalimat tegas).
2. audience: Segmen spesifik (bukan "semua orang"). Apa profesi/usia/masalah mereka?
3. voice: Gaya bahasa (contoh: witty, tegas, empati) lengkap dengan contoh sapaan/diksi.
4. pov: Sudut pandang brand (contoh: 'Sebagai expert yang membimbing').
5. proof: Bukti kredibilitas (angka, fakta, nama pelanggan).
6. guardrails: Pantangan topik, kata yang dihindari, dan aturan bahasa.
7. pillars: Array string berisi 3-5 topik utama.

Output JSON: { "who": "...", "audience": "...", "voice": "...", "pov": "...", "proof": "...", "guardrails": "...", "pillars": ["...", "..."] }`,
      },
    ])

    if (!object) {
      return { error: "AI gagal mengekstrak Brand DNA. Coba lagi." }
    }

    const parsed = BrandProfileSchema.safeParse(object)
    if (!parsed.success) {
      return { error: "Format output AI tidak sesuai. Coba lagi." }
    }

    return { profile: parsed.data }
  } catch (error: unknown) {
    logger.error("generateBrandProfile failed", { error })
    return { error: error instanceof Error ? error.message : "Failed to generate brand profile" }
  }
}

/** Meminta OAuth authorization URL untuk platform sosial tertentu via API handler */
export async function requestOAuthUrl(params: { clientId: string; platform: string }): Promise<{ url: string }> {
  const res = await fetch('/api/social/oauth-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.url) {
    throw new Error(data.error || 'Failed to get OAuth URL')
  }
  return { url: data.url }
}
