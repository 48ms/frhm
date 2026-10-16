'use server'

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit/log"
import { assertAdmin } from "@/lib/auth/guard"
import { UpdateClientSchema, type UpdateClientInput } from "./types"

/**
 * Service Layer untuk Client Management (CRUD)
 * Mematuhi Aturan Kedaulatan Supabase Auth, PostgreSQL RLS, dan Audit Logging.
 */

export async function updateClient(rawInput: UpdateClientInput) {
  await assertAdmin()
  const input = UpdateClientSchema.parse(rawInput)
  const supabase = await createClient()

  // 1. Ambil profil brand eksisting agar guardrails, voice, dan pillars tetap utuh
  const { data: existingClient, error: fetchErr } = await supabase
    .from("clients")
    .select("id, name, brand_profile")
    .eq("id", input.id)
    .single()

  if (fetchErr || !existingClient) {
    logger.error("updateClient: client not found", { error: fetchErr, id: input.id })
    throw new Error(fetchErr?.message || "Client workspace tidak ditemukan.")
  }

  const existingProfile = (existingClient.brand_profile as Record<string, unknown>) || {}
  const mergedBrandProfile = {
    ...existingProfile,
    who: input.name,
    ...(input.niche !== undefined ? { niche: input.niche } : {}),
    ...(input.tagline !== undefined ? { tagline: input.tagline } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
  }

  // 2. Lakukan update data
  const { data: updated, error: updateErr } = await supabase
    .from("clients")
    .update({
      name: input.name,
      contact_email: input.contact_email || null,
      contact_phone: input.contact_phone || null,
      telegram_chat_id: input.telegram_chat_id || null,
      brand_profile: mergedBrandProfile,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .select("id, name, contact_email, contact_phone, brand_profile, updated_at")
    .single()

  if (updateErr || !updated) {
    logger.error("updateClient error", { error: updateErr, id: input.id })
    throw new Error(updateErr?.message || "Gagal memperbarui data client workspace.")
  }

  void logAudit({
    action: "client.update",
    entityType: "client",
    entityId: input.id,
    summary: `Updated client "${input.name}"`,
  })

  return updated
}

export async function deleteClient(clientId: string) {
  await assertAdmin()
  const supabase = await createClient()

  // 1. Verifikasi keberadaan client
  const { data: client, error: fetchErr } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", clientId)
    .single()

  if (fetchErr || !client) {
    logger.error("deleteClient: client not found", { error: fetchErr, id: clientId })
    throw new Error("Client workspace tidak ditemukan atau sudah dihapus.")
  }

  // 2. Unlink user profil yang terikat dengan client ini agar tidak terjadi foreign key constraint error
  const { error: userUnlinkErr } = await supabase
    .from("users")
    .update({ client_id: null })
    .eq("client_id", clientId)

  if (userUnlinkErr) {
    logger.warn("deleteClient: user unlink warning", { error: userUnlinkErr, clientId })
  }

  // 3. Hapus data client dari tabel utama (relasi anak CASCADE akan dibersihkan otomatis oleh PostgreSQL)
  const { error: deleteErr } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)

  if (deleteErr) {
    logger.error("deleteClient error", { error: deleteErr, id: clientId })
    throw new Error(deleteErr.message || "Gagal menghapus client workspace dari database.")
  }

  void logAudit({
    action: "client.delete",
    entityType: "client",
    entityId: clientId,
    summary: `Deleted client workspace "${client.name}" (${clientId})`,
  })

  return { success: true, id: clientId, name: client.name }
}
