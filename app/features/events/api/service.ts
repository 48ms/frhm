'use server'

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit/log"
import type { EventItem, CreateEventInput, UpdateEventInput } from "./types"

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

export async function updateEvent(
  input: UpdateEventInput
): Promise<{ success: boolean; data?: EventItem; error?: string }> {
  const supabase = await createClient()

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (input.name !== undefined) payload.name = input.name
  if (input.description !== undefined) payload.description = input.description
  if (input.event_date !== undefined) payload.event_date = input.event_date
  if (input.location !== undefined) payload.location = input.location
  if (input.status !== undefined) payload.status = input.status

  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", input.id)
    .select("*")
    .single()

  if (error) {
    logger.error("updateEvent failed", { error })
    return { success: false, error: error.message }
  }

  void logAudit({
    action: "event.update",
    entityType: "event",
    entityId: input.id,
    summary: `Updated event "${data.name}"`,
  })

  return { success: true, data: data as EventItem }
}

export async function deleteEvent(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)

  if (error) {
    logger.error("deleteEvent failed", { error })
    return { success: false, error: error.message }
  }

  void logAudit({
    action: "event.delete",
    entityType: "event",
    entityId: id,
    summary: `Deleted event ${id}`,
  })

  return { success: true }
}
