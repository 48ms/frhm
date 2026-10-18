"use server"

import { createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/audit/log"
import type {
  ClientFile,
  UpdateClientFileInput,
  VerifyClientFileInput,
  DeleteClientFileInput,
} from "./types"
import { markdownToBrandProfile, brandProfileToMarkdown } from "@/lib/brand-context"
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

  // 2. Dual-write sync ke JSONB clients.brand_profile agar UI dashboard dan AI studio selalu tersinkronisasi
  const syncableBrandFiles = [
    "brand-profile.md",
    "voice.md",
    "guardrails.md",
    "audience.md",
    "content-pillars.md",
    "offers.md",
    "social-strategy.md",
  ]

  if (syncableBrandFiles.includes(path)) {
    try {
      const { data: clientRow } = await supabase
        .from("clients")
        .select("name, brand_profile")
        .eq("id", clientId)
        .maybeSingle()

      const clientName = clientRow?.name || "Client"
      const existingProfile = (clientRow?.brand_profile as Partial<BrandProfile>) || {}
      let mergedProfile: BrandProfile = {
        who: existingProfile.who ?? "",
        audience: existingProfile.audience ?? "",
        voice: existingProfile.voice ?? "",
        pov: existingProfile.pov ?? "",
        proof: existingProfile.proof ?? "",
        guardrails: existingProfile.guardrails ?? "",
        pillars: existingProfile.pillars ?? [],
        ...existingProfile,
      }

      if (path === "brand-profile.md") {
        const parsed = markdownToBrandProfile(content)
        mergedProfile = {
          ...mergedProfile,
          who: parsed.who ?? mergedProfile.who ?? "",
          audience: parsed.audience ?? mergedProfile.audience ?? "",
          voice: parsed.voice ?? mergedProfile.voice ?? "",
          pov: parsed.pov ?? mergedProfile.pov ?? "",
          proof: parsed.proof ?? mergedProfile.proof ?? "",
          guardrails: parsed.guardrails ?? mergedProfile.guardrails ?? "",
          pillars: parsed.pillars && parsed.pillars.length > 0 ? parsed.pillars : mergedProfile.pillars ?? [],
          ...(parsed.identity ? { identity: parsed.identity } : {}),
          ...(parsed.positioning ? { positioning: parsed.positioning } : {}),
          ...(parsed.offers_ctas ? { offers_ctas: parsed.offers_ctas } : {}),
          ...(parsed.channels ? { channels: parsed.channels } : {}),
          ...(parsed.operational_defaults ? { operational_defaults: parsed.operational_defaults } : {}),
          ...(parsed.examples ? { examples: parsed.examples } : {}),
          ...(parsed.notes ? { notes: parsed.notes } : {}),
        }

        // Bi-directional Fan-Out: sinkronkan sub-files di client_files
        const subFilesToUpsert: Array<{ path: string; content: string }> = []
        if (parsed.voice) {
          subFilesToUpsert.push({
            path: "voice.md",
            content: `# Brand Voice & Tone Guide — ${clientName}\n\n## Tone of Voice\n${parsed.voice}`,
          })
        }
        if (parsed.audience) {
          subFilesToUpsert.push({
            path: "audience.md",
            content: `# Target Audience & ICP — ${clientName}\n\n## Audience Persona\n${parsed.audience}`,
          })
        }
        if (parsed.guardrails) {
          subFilesToUpsert.push({
            path: "guardrails.md",
            content: `# Brand Guardrails & Never-List — ${clientName}\n\n## Never-List & Restrictions\n${parsed.guardrails}`,
          })
        }
        if (parsed.pillars && parsed.pillars.length > 0) {
          subFilesToUpsert.push({
            path: "content-pillars.md",
            content: `# Content Pillars & Focus Areas — ${clientName}\n\n${parsed.pillars
              .map((p) => (p.startsWith("-") ? p : `- ${p}`))
              .join("\n")}`,
          })
        }
        if (parsed.offers_ctas) {
          subFilesToUpsert.push({
            path: "offers.md",
            content: `# Offers & Product Catalog — ${clientName}\n\n## Offers & CTAs\n${parsed.offers_ctas}`,
          })
        }

        for (const sub of subFilesToUpsert) {
          try {
            await supabase.from("client_files").upsert(
              {
                client_id: clientId,
                path: sub.path,
                content: sub.content,
                updated_at: now,
                needs_verification: sub.content.includes("(verify-quarterly)"),
              },
              { onConflict: "client_id,path" }
            )
          } catch {
            // Non-blocking fan-out
          }
        }
      } else if (path === "voice.md") {
        if (content.trim()) {
          mergedProfile.voice = content.trim()
        }
      } else if (path === "guardrails.md") {
        if (content.trim()) {
          mergedProfile.guardrails = content.trim()
        }
      } else if (path === "audience.md") {
        if (content.trim()) {
          mergedProfile.audience = content.trim()
        }
      } else if (path === "offers.md") {
        if (content.trim()) {
          mergedProfile.offers_ctas = content.trim()
        }
      } else if (path === "content-pillars.md") {
        const lines = content
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.startsWith("- ") || l.startsWith("* "))
          .map((l) => l.replace(/^[-*]\s+/, "").trim())
          .filter(Boolean)
        if (lines.length > 0) {
          mergedProfile.pillars = lines
        }
      }

      await supabase
        .from("clients")
        .update({ brand_profile: mergedProfile, updated_at: now })
        .eq("id", clientId)

      // Bi-directional Master Sync: jika sub-file yang di-update, re-generate master brand-profile.md
      if (path !== "brand-profile.md") {
        try {
          const masterContent = brandProfileToMarkdown(mergedProfile, clientName)
          await supabase.from("client_files").upsert(
            {
              client_id: clientId,
              path: "brand-profile.md",
              content: masterContent,
              updated_at: now,
              needs_verification: masterContent.includes("(verify-quarterly)"),
            },
            { onConflict: "client_id,path" }
          )
        } catch {
          // Non-blocking master sync
        }
      }
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
