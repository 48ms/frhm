'use server'

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
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
  
  // Mengambil data klien faktual (bukan tabel fiktif)
  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("*")
    .not("name", "ilike", "%Test Client%")
    .order('created_at', { ascending: false })
    
  // Catatan faktual: service ini dipanggil dari `useSuspenseQuery` saat render.
  // Jika kita `throw`, React Query me-reject promise saat render dan memicu
  // warning "Cannot update a component (Router) while rendering". Degrade
  // gracefully: kembalikan [] agar UI memakai fallback, bukan crash.
  if (clientsError) {
    logger.error("getClientsWithChannels (clients) failed", { error: clientsError })
    return []
  }
  if (!clients) return []

  // Mengambil data channel sosial faktual
  const { data: channels, error: channelsError } = await supabase
    .from("client_channels")
    .select("*")

  if (channelsError) {
    logger.error("getClientsWithChannels (channels) failed", { error: channelsError })
    return clients.map((client) => ({ ...client, channels: [] })) as ClientWithChannels[]
  }

  // Fetch dashboard profiles
  const { data: profiles } = await supabase
    .from("dashboard_profiles")
    .select("client_id, metrics")

  // Menggabungkan data
  return clients.map((client) => {
    const profile = profiles?.find((p) => p.client_id === client.id)
    const metricsObj = profile?.metrics as Record<string, unknown> | undefined
    return {
      ...client,
      channels: (channels || []).filter((ch) => ch.client_id === client.id),
      dashboard_profile: profile ? { audience_size: metricsObj?.audience_size ?? 0 } : undefined
    }
  }) as ClientWithChannels[]
}

/** Menghapus koneksi akun (Disconnect) */
export async function disconnectChannel(channelId: string): Promise<void> {
  const supabase = await createClient()
  
  // Sesuai dengan woopsocial.md & 014_client_channels, disconnect 
  // berarti menghapus record dari table client_channels (atau mengubah status).
  // Di sini kita menghapus dari client_channels.
  const { error } = await supabase
    .from("client_channels")
    .delete()
    .eq("id", channelId)

  if (error) throw new Error(error.message)
}

/** Menyinkronkan ulang akun (Refresh Data) via Bridge */
export async function syncChannel(channelId: string): Promise<void> {
  const supabase = await createClient()
  
  // 1. Fetch channel and client info
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

  const apiKey = process.env.AYRSHARE_API_KEY
  if (!apiKey) {
    throw new Error("Ayrshare API key not configured")
  }

  // 2. Fetch profiles from Ayrshare
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

  // 3. Update database
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
  } else {
    // If it's missing from Ayrshare profiles, it might be disconnected.
    await supabase
      .from("client_channels")
      .update({
        status: "gagal",
        updated_at: new Date().toISOString()
      })
      .eq("id", channelId)
      
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

  // Sync the canonical brand-profile.md so every skill-driven Copilot call reads the same source.
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
  } catch (error: any) {
    logger.error("generateBrandProfile failed", { error })
    return { error: error.message || "Failed to generate brand profile" }
  }
}
