import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendTelegramMessage } from "@/lib/telegram/service"
import { logAudit } from "@/lib/audit/log"
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/middleware/rate-limit"
import { z } from "zod"

export const dynamic = "force-dynamic"

const bodySchema = z.object({
  subject: z.string().min(1, "Subject required"),
  message: z.string().min(1, "Message required"),
  priority: z.string(),
  clientId: z.string().optional(),
})

export async function POST(request: Request) {
  const rl = checkRateLimit(
    getClientIp(request.headers),
    "support/submit",
    RATE_LIMITS.mutation.limit,
    RATE_LIMITS.mutation.windowMs
  )
  if (rl.limited) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single()

  let payload
  try {
    payload = bodySchema.parse(await request.json())
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Invalid payload" }, { status: 400 })
  }

  // Persist tiket ke DB agar user/klien bisa melihat histori & statusnya.
  // RLS menjamin tenant isolation (client_insert_own / admin_all).
  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .insert({
      client_id: payload.clientId || null,
      created_by: user.id,
      subject: payload.subject,
      message: payload.message,
      priority: payload.priority,
      status: "open",
    })
    .select("id")
    .single()

  if (ticketError) {
    console.error("[support/submit] ticket insert failed:", ticketError.message)
    return NextResponse.json({ error: "Gagal menyimpan tiket dukungan" }, { status: 500 })
  }

  // Kirim ke chat admin Frahma (env var konsisten dengan lib/telegram/service.ts)
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (adminChatId) {
    const text = [
      `🚨 <b>New Support Request</b>`,
      ``,
      `<b>From:</b> ${userProfile?.full_name || user.email} (${userProfile?.role})`,
      `<b>Client ID:</b> ${payload.clientId || "N/A"}`,
      `<b>Priority:</b> ${payload.priority}`,
      `<b>Subject:</b> ${payload.subject}`,
      ``,
      `<b>Message:</b>`,
      `<i>${payload.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</i>`,
    ].join("\n")

    await sendTelegramMessage({
      chatId: adminChatId,
      text,
      recipientType: "admin",
      recipientId: "system",
      eventType: "support_request_submitted",
    })
  }

  void logAudit({
    action: "support.submit",
    actorId: user.id,
    entityType: "support_tickets",
    entityId: ticket.id,
    clientId: payload.clientId || null,
    summary: `Support request submitted: ${payload.subject}`,
    request,
  })

  return NextResponse.json({ success: true, ticketId: ticket.id })
}
