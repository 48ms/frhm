"use server"

import { createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/audit/log"
import type {
  ClientFile,
  UpdateClientFileInput,
  VerifyClientFileInput,
  DeleteClientFileInput,
} from "./types"
import { markdownToBrandProfile } from "@/lib/brand-context"
import type { BrandProfile } from "@/features/social-accounts/api/types"

/**
 * Fetch all client foundation markdown files from client_files table.
 */
export async function getClientFiles(clientId: string): Promise<ClientFile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("client_files")
    .select("client_id, path, content, updated_at, needs_verification, verified_at")
    .eq("client_id", clientId)
    .order("path", { ascending: true })

  if (error) {
    throw new Error(`Gagal memuat client files: ${error.message}`)
  }

  return (data || []) as ClientFile[]
}

/**
 * Fetch a single client file by client ID and relative path.
 */
export async function getClientFile(clientId: string, path: string): Promise<ClientFile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("client_files")
    .select("client_id, path, content, updated_at, needs_verification, verified_at")
    .eq("client_id", clientId)
    .eq("path", path)
    .maybeSingle()

  if (error) {
    throw new Error(`Gagal memuat file ${path}: ${error.message}`)
  }

  return data as ClientFile | null
}

/**
 * Create or update a client file in client_files table with verify-quarterly tag detection
 * and automatic synchronization with clients.brand_profile if path === 'brand-profile.md'.
 */
export async function upsertClientFile(input: UpdateClientFileInput): Promise<ClientFile> {
  const { clientId, path, content } = input
  if (!clientId) throw new Error("Client ID wajib disertakan.")
  if (!path) throw new Error("Path file wajib disertakan.")

  const supabase = await createClient()

  const hasVerifyQuarterly = content.includes("(verify-quarterly)")
  const now = new Date().toISOString()

  // 1. Upsert ke tabel client_files
  const { data, error } = await supabase
    .from("client_files")
    .upsert(
      {
        client_id: clientId,
        path,
        content,
        updated_at: now,
        needs_verification: hasVerifyQuarterly,
      },
      { onConflict: "client_id,path" }
    )
    .select("client_id, path, content, updated_at, needs_verification, verified_at")
    .single()

  if (error) {
    throw new Error(`Gagal menyimpan file ${path}: ${error.message}`)
  }

  // 2. Jika ini adalah brand-profile.md, sync ke JSONB clients.brand_profile
  if (path === "brand-profile.md") {
    try {
      const parsed = markdownToBrandProfile(content)
      // Ambil profile yang sudah ada agar tidak menghapus field yang tidak ada di format md
      const { data: clientRow } = await supabase
        .from("clients")
        .select("brand_profile")
        .eq("id", clientId)
        .maybeSingle()

      const existingProfile = (clientRow?.brand_profile as Partial<BrandProfile>) || {}
      const mergedProfile: BrandProfile = {
        who: parsed.who ?? existingProfile.who ?? "",
        audience: parsed.audience ?? existingProfile.audience ?? "",
        voice: parsed.voice ?? existingProfile.voice ?? "",
        pov: parsed.pov ?? existingProfile.pov ?? "",
        proof: parsed.proof ?? existingProfile.proof ?? "",
        guardrails: parsed.guardrails ?? existingProfile.guardrails ?? "",
        pillars: parsed.pillars ?? existingProfile.pillars ?? [],
      }

      await supabase
        .from("clients")
        .update({ brand_profile: mergedProfile, updated_at: now })
        .eq("id", clientId)
    } catch (syncErr) {
      console.warn("Dual-write sync to clients.brand_profile failed silently:", syncErr)
    }
  }

  void logAudit({
    action: "brand_file.upsert",
    entityType: "client_file",
    entityId: `${clientId}/${path}`,
    clientId,
    summary: `Updated brand file ${path} for client ${clientId}`,
    metadata: { path, hasVerifyQuarterly },
  })

  return data as ClientFile
}

/**
 * Mark a file as verified for the current quarter.
 */
export async function verifyClientFile(input: VerifyClientFileInput): Promise<void> {
  const { clientId, path } = input
  const supabase = await createClient()

  const { error } = await supabase
    .from("client_files")
    .update({
      needs_verification: false,
      verified_at: new Date().toISOString(),
    })
    .eq("client_id", clientId)
    .eq("path", path)

  if (error) {
    throw new Error(`Gagal memverifikasi file ${path}: ${error.message}`)
  }

  void logAudit({
    action: "brand_file.verify",
    entityType: "client_file",
    entityId: `${clientId}/${path}`,
    clientId,
    summary: `Verified brand file ${path} for current quarter`,
    metadata: { path },
  })
}

/**
 * Delete a custom client file (brand-profile.md is protected).
 */
export async function deleteClientFile(input: DeleteClientFileInput): Promise<void> {
  const { clientId, path } = input
  if (path === "brand-profile.md") {
    throw new Error("brand-profile.md adalah file inti brand dan tidak boleh dihapus.")
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("client_files")
    .delete()
    .eq("client_id", clientId)
    .eq("path", path)

  if (error) {
    throw new Error(`Gagal menghapus file ${path}: ${error.message}`)
  }

  void logAudit({
    action: "brand_file.delete",
    entityType: "client_file",
    entityId: `${clientId}/${path}`,
    clientId,
    summary: `Deleted brand file ${path}`,
    metadata: { path },
  })
}
