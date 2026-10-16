"use server"

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit/log"
import { sendTelegramMessage } from "@/lib/telegram/service"
import { env } from "@/lib/env"
import type { SupportTicket, CreateSupportTicketInput } from "./types"

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

export async function createSupportTicket(input: CreateSupportTicketInput): Promise<SupportTicket> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      client_id: input.clientId || null,
      created_by: user.id,
      subject: input.subject.trim(),
      message: input.message.trim(),
      priority: input.priority,
      status: "open",
    })
    .select()
    .single()

  if (error) {
    logger.error("createSupportTicket failed", { error })
    throw new Error("Gagal menyimpan tiket dukungan")
  }

  void logAudit({
    action: "support_ticket.create",
    entityType: "support_ticket",
    entityId: data?.id ?? null,
    clientId: input.clientId || null,
    summary: `Created support ticket: ${input.subject}`,
  })

  // Kirim notifikasi Telegram ke Admin Frahma (non-blocking)
  try {
    const adminChatId = env.server.TELEGRAM_ADMIN_CHAT_ID || env.server.ADMIN_TELEGRAM_CHAT_ID
    if (adminChatId) {
      const priorityEmoji = input.priority === "Urgent" ? "🚨" : input.priority === "High" ? "⚠️" : "📩"
      const text = [
        `${priorityEmoji} <b>New Support Request [${input.priority.toUpperCase()}]</b>`,
        ``,
        `<b>From User:</b> ${user.email}`,
        `<b>Client ID:</b> ${input.clientId || "N/A"}`,
        `<b>Subject:</b> ${input.subject.trim()}`,
        ``,
        `<b>Message:</b>`,
        `<i>${input.message.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</i>`,
      ].join("\n")

      await sendTelegramMessage({
        chatId: adminChatId,
        text,
        recipientType: "admin",
        recipientId: "system",
        eventType: "support_request_submitted",
      })
    }
  } catch (tgErr: unknown) {
    logger.warn("createSupportTicket.telegramFailed", {
      error: tgErr instanceof Error ? tgErr.message : String(tgErr),
    })
  }

  return data as SupportTicket
}
