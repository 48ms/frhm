"use server"

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { z } from "zod"
import type { Deliverable, DeliverableType } from "./types"

/**
 * Service Layer untuk Deliverables.
 * 100% Supabase Auth & PostgreSQL RLS (sesuai aturan Frhm).
 * Degrade gracefully -> [] saat error agar useSuspenseQuery tidak reject saat render.
 */
export async function getDeliverablesByClient(clientId: string): Promise<Deliverable[]> {
  if (!clientId) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("deliverables")
    .select("id, client_id, type, title, content_md, external_link, status, created_by, updated_by, created_at, updated_at, sent_at, approved_at")
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })

  if (error) {
    logger.error("getDeliverablesByClient failed", { error })
    return []
  }
  return (data ?? []) as Deliverable[]
}

export const createDeliverableSchema = z.object({
  clientId: z.string().min(1, "Client ID wajib diisi"),
  type: z.enum(["brief", "content", "report"]),
  title: z.string().min(3, "Judul minimal 3 karakter").max(120, "Judul terlalu panjang"),
  content_md: z.string().default(""),
  external_link: z.string().url("URL eksternal tidak valid").or(z.literal("")).default(""),
})

export type CreateDeliverableInput = z.infer<typeof createDeliverableSchema>

/**
 * Buat deliverable baru untuk klien aktif. Status awal selalu "draft"
 * (constraint DB); kirim/ approve adalah transisi terpisah.
 */
export async function createDeliverable(input: CreateDeliverableInput): Promise<Deliverable> {
  const safe = createDeliverableSchema.parse(input)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("deliverables")
    .insert({
      client_id: safe.clientId,
      type: safe.type as DeliverableType,
      title: safe.title,
      content_md: safe.content_md,
      external_link: safe.external_link || null,
      status: "draft",
    })
    .select()
    .single()

  if (error) {
    logger.error("createDeliverable failed", { error })
    throw new Error("Gagal membuat deliverable")
  }

  return data as Deliverable
}
