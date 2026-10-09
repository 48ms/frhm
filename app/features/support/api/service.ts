"use server"

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import type { SupportTicket } from "./types"

/**
 * Service Layer untuk Support Tickets.
 * 100% Supabase Auth & PostgreSQL RLS (sesuai aturan Frhm).
 * Degrade gracefully -> [] saat error agar list tidak reject saat render.
 */
export async function getSupportTicketsByClient(clientId: string): Promise<SupportTicket[]> {
  if (!clientId) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, client_id, created_by, subject, message, priority, status, admin_reply, resolved_at, created_at, updated_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })

  if (error) {
    logger.error("getSupportTicketsByClient failed", { error })
    return []
  }
  return (data ?? []) as SupportTicket[]
}
