'use server'

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit/log"
import type { EventItem, CreateEventInput } from "./types"

export async function getEvents(clientId: string): Promise<EventItem[]> {
  if (!clientId) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("events")
    .select("id, client_id, name, description, event_date, location, status, created_at, updated_at")
    .eq("client_id", clientId)
    .order("event_date", { ascending: true })

  if (error) {
    logger.error("getEvents failed", { error })
    return []
  }
  return (data ?? []) as EventItem[]
}

export async function createEvent(
  input: CreateEventInput
): Promise<{ success: boolean; data?: EventItem; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("events")
    .insert({
      client_id: input.client_id,
      name: input.name,
      description: input.description || null,
      event_date: input.event_date || new Date().toISOString(),
      location: input.location || null,
      status: input.status || "upcoming",
    })
    .select("*")
    .single()

  if (error) {
    logger.error("createEvent failed", { error })
    return { success: false, error: error.message }
  }

  void logAudit({
    action: "event.create",
    entityType: "event",
    entityId: data.id,
    summary: `Created event "${data.name}"`,
  })

  return { success: true, data: data as EventItem }
}
