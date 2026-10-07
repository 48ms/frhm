"use server"

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import type { Campaign, CreateCampaignInput, UpdateCampaignInput } from "./types"

/**
 * Service Layer untuk Campaigns (content_campaigns).
 * 100% Supabase Auth & PostgreSQL RLS (sesuai aturan Frhm).
 */

/** Mengambil daftar campaign untuk satu klien. Degrade gracefully -> [] saat error. */
export async function getCampaigns(clientId: string): Promise<Campaign[]> {
  if (!clientId) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("content_campaigns")
    .select("id, client_id, name, type, start_date, end_date, color, notes, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })

  // Degrade gracefully: JANGAN throw, agar useSuspenseQuery/useQuery tidak
  // me-reject saat render (memicu warning "Cannot update Router while rendering").
  if (error) {
    logger.error("getCampaigns failed", { error })
    return []
  }
  return (data ?? []) as Campaign[]
}

/** Membuat campaign baru. */
export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("content_campaigns")
    .insert(input)
    .select("id, client_id, name, type, start_date, end_date, color, notes, created_at")
    .single()

  if (error) throw new Error(error.message)
  return data as Campaign
}

/** Memperbarui campaign. */
export async function updateCampaign(
  id: string,
  patch: UpdateCampaignInput
): Promise<Campaign> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("content_campaigns")
    .update(patch)
    .eq("id", id)
    .select("id, client_id, name, type, start_date, end_date, color, notes, created_at")
    .single()

  if (error) throw new Error(error.message)
  return data as Campaign
}

/** Menghapus campaign. */
export async function deleteCampaign(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("content_campaigns").delete().eq("id", id)
  if (error) throw new Error(error.message)
}
