"use server"

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit/log"
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
  void logAudit({
    action: 'campaign.create',
    entityType: 'content_campaign',
    entityId: data?.id ?? null,
    clientId: input.client_id ?? null,
    summary: `Created campaign "${input.name}"`,
  })
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
  void logAudit({
    action: 'campaign.update',
    entityType: 'content_campaign',
    entityId: id,
    clientId: patch.client_id ?? null,
    summary: `Updated campaign ${id}`,
  })
  return data as Campaign
}

/** Menghapus campaign. */
export async function deleteCampaign(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("content_campaigns").delete().eq("id", id)
  if (error) throw new Error(error.message)
  void logAudit({
    action: 'campaign.delete',
    entityType: 'content_campaign',
    entityId: id,
    summary: `Deleted campaign ${id}`,
  })
}
