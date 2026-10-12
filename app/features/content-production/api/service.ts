"use server"

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit/log"
import type { ContentProduction, CreateContentProductionInput, UpdateContentProductionInput } from "./types"

/**
 * Service Layer for Content Production (content_productions).
 * 100% Supabase Auth & PostgreSQL RLS.
 */

export async function getContentProductions(clientId: string): Promise<ContentProduction[]> {
  if (!clientId) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("content_productions")
    .select("*")
    .eq("client_id", clientId)
    .order("due_date", { ascending: true })

  if (error) {
    logger.error("getContentProductions failed", { error })
    return []
  }
  return (data ?? []) as ContentProduction[]
}

export async function createContentProduction(input: CreateContentProductionInput): Promise<ContentProduction> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("content_productions")
    .insert(input)
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  void logAudit({
    action: 'content_production.create',
    entityType: 'content_production',
    entityId: data?.id ?? null,
    clientId: input.client_id ?? null,
    summary: `Created content production ${data?.id ?? ''}`,
  })
  return data as ContentProduction
}

export async function updateContentProduction(
  id: string,
  patch: UpdateContentProductionInput
): Promise<ContentProduction> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("content_productions")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  void logAudit({
    action: 'content_production.update',
    entityType: 'content_production',
    entityId: id,
    summary: `Updated content production ${id}`,
  })
  return data as ContentProduction
}

export async function deleteContentProduction(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from("content_productions").delete().eq("id", id)
  if (error) throw new Error(error.message)
  void logAudit({
    action: 'content_production.delete',
    entityType: 'content_production',
    entityId: id,
    summary: `Deleted content production ${id}`,
  })
}
