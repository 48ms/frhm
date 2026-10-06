'use server'

import { createClient } from "@/lib/supabase/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { BrandProfileSchema, type FrahmaClient, type ClientChannel, type ClientWithChannels, type GenerateBrandProfileInput } from "./types"

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
    
  // Catatan faktual: service ini dipanggil dari `useSuspenseQuery` saat render.
  // Jika kita `throw`, React Query me-reject promise saat render dan memicu
  // warning "Cannot update a component (Router) while rendering". Degrade
  // gracefully: kembalikan [] agar UI memakai fallback, bukan crash.
  if (clientsError) {
    console.error("[getClientsWithChannels] clients error:", clientsError.message)
    return []
  }
  if (!clients) return []

  // Mengambil data channel sosial faktual
  const { data: channels, error: channelsError } = await supabase
    .from("client_channels")
    .select("*")

  if (channelsError) {
    console.error("[getClientsWithChannels] channels error:", channelsError.message)
    return clients.map((client) => ({ ...client, channels: [] })) as ClientWithChannels[]
  }

  // Fetch dashboard profiles for audience size
  const { data: profiles, error: profilesError } = await supabase
    .from("dashboard_profiles")
    .select("client_id, audience_size")

  // Menggabungkan data
  return clients.map((client) => {
    const profile = profiles?.find((p) => p.client_id === client.id)
    return {
      ...client,
      channels: (channels || []).filter((ch) => ch.client_id === client.id),
      dashboard_profile: profile ? { audience_size: profile.audience_size } : undefined
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

/** Update Brand Profile */
export async function updateBrandProfile(clientId: string, profile: any): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("clients")
    .update({ brand_profile: profile })
    .eq("id", clientId)

  if (error) throw new Error(error.message)
}

export async function generateBrandProfile(input: GenerateBrandProfileInput) {
  try {
    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: BrandProfileSchema,
      prompt: `Kamu adalah Senior Brand Strategist. Tugasmu adalah mengekstrak dan membangun Brand DNA dari materi mentah yang diberikan klien.
      
      Materi mentah:
      ${input.rawMaterial}

      Industri (opsional): ${input.industry || "Tidak dispesifikasikan"}

      Instruksi Ekstraksi:
      1. who: Penjelasan ringkas identitas bisnis (1 kalimat tegas).
      2. audience: Segmen spesifik (bukan "semua orang"). Apa profesi/usia/masalah mereka?
      3. voice: Gaya bahasa (contoh: witty, tegas, empati) lengkap dengan contoh sapaan/diksi.
      4. pov: Sudut pandang brand (contoh: 'Sebagai expert yang membimbing', 'Sebagai rebel yang menantang industri').
      5. proof: Bukti kredibilitas (angka, fakta, nama pelanggan).
      6. guardrails: Pantangan topik, kata yang dihindari, dan aturan bahasa.
      7. pillars: Array string yang berisi 3-5 topik utama (contoh: ["Edukasi Kopi", "Behind the Scenes", "Promo & Event"]).
      
      Hasilkan output dalam bahasa Indonesia yang siap digunakan oleh copywriter. Hindari abstraksi, gunakan spesifisitas.`,
    })

    return { profile: result.object }
  } catch (error: any) {
    console.error("AI Generation failed:", error)
    return { error: error.message || "Failed to generate brand profile" }
  }
}
