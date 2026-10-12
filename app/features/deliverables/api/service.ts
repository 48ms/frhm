"use server"

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit/log"
import { createDeliverableSchema, type CreateDeliverableInput } from "./schema"
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

  void logAudit({
    action: 'deliverable.create',
    entityType: 'deliverable',
    entityId: data?.id ?? null,
    clientId: safe.clientId ?? null,
    summary: `Created deliverable "${safe.title}"`,
  })

  return data as Deliverable
}
