"use server"

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import type { Deliverable } from "./types"

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
