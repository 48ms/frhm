import { NextResponse } from 'next/server'
import {
  verifyWhatsAppWebhookGet,
  verifyWhatsAppWebhookPost,
} from '@/lib/whatsapp/verify-webhook'
import { logger } from '@/lib/logger'
import { logAudit } from '@/lib/audit/log'
import { sendTelegramMessage } from '@/lib/telegram/service'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'

/**
 * GET Handler: Handshake verifikasi webhook Meta WhatsApp Cloud API
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = env.server.WHATSAPP_WEBHOOK_VERIFY_TOKEN

  const verification = verifyWhatsAppWebhookGet(verifyToken, mode, token, challenge)

  if (!verification.ok) {
    logger.warn('whatsapp.webhook.handshake_failed', {
      route: 'api/whatsapp/webhook',
      reason: verification.reason,
    })
    return NextResponse.json({ error: verification.reason }, { status: 403 })
  }

  logger.info('whatsapp.webhook.handshake_success', {
    route: 'api/whatsapp/webhook',
  })

  return new Response(verification.challenge, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  })
}

/**
 * POST Handler: Penerima event status pesan dan pesan masuk WhatsApp
 */
export async function POST(request: Request) {
  const secretHeader =
    request.headers.get('x-whatsapp-webhook-secret') ||
    request.headers.get('x-hub-signature-256')

  const configuredSecret = env.server.WHATSAPP_WEBHOOK_VERIFY_TOKEN

  const verification = verifyWhatsAppWebhookPost(configuredSecret, secretHeader)
  if (!verification.ok) {
    logger.warn('whatsapp.webhook.rejected', {
      route: 'api/whatsapp/webhook',
      reason: verification.reason,
    })
    return NextResponse.json({ error: 'Unauthorized webhook request' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  // Ekstraksi pesan atau status Meta WhatsApp Cloud API
  const entry = Array.isArray(body?.entry) ? (body.entry[0] as Record<string, unknown>) : null
  const changes = Array.isArray(entry?.changes) ? (entry.changes[0] as Record<string, unknown>) : null
  const value = (changes?.value as Record<string, unknown>) || null
  const messages = Array.isArray(value?.messages) ? (value.messages as Array<Record<string, unknown>>) : null
  const statuses = Array.isArray(value?.statuses) ? (value.statuses as Array<Record<string, unknown>>) : null
  const contacts = Array.isArray(value?.contacts) ? (value.contacts as Array<Record<string, unknown>>) : null

  const firstMsg = messages?.[0]
  const senderNumber = typeof firstMsg?.from === 'string' ? firstMsg.from : null
  const messageText = typeof (firstMsg?.text as { body?: string } | undefined)?.body === 'string'
    ? (firstMsg?.text as { body?: string }).body
    : null
  const contactName = typeof (contacts?.[0]?.profile as { name?: string } | undefined)?.name === 'string'
    ? (contacts?.[0]?.profile as { name?: string }).name
    : null

  // Catat event pesan atau status ke audit log & Telegram
  try {
    if (firstMsg) {
      await logAudit({
        action: 'whatsapp.message_received',
        summary: `Pesan WhatsApp dari ${contactName ? `${contactName} (${senderNumber})` : senderNumber}: "${messageText?.slice(0, 80) || '[Media/Non-teks]'}"`,
        metadata: {
          from: senderNumber,
          contactName,
          text: messageText,
          messageId: firstMsg.id,
          timestamp: new Date().toISOString(),
        },
      })

      // Kirim alert ke Telegram Admin jika admin chat ID dikonfigurasi
      const adminChatId = env.server.TELEGRAM_ADMIN_CHAT_ID || env.server.ADMIN_TELEGRAM_CHAT_ID
      if (adminChatId && messageText) {
        await sendTelegramMessage({
          chatId: adminChatId,
          text: `💬 <b>Pesan WhatsApp Masuk</b>\n\nDari: <b>${contactName ? `${contactName} (+${senderNumber})` : `+${senderNumber}`}</b>\n\nPesan:\n<i>${messageText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</i>`,
          parseMode: 'HTML',
          recipientType: 'admin',
          recipientId: 'system',
          eventType: 'whatsapp_inbound_message',
        })
      }
    } else if (statuses?.[0]) {
      const st = statuses[0]
      await logAudit({
        action: `whatsapp.status_${st.status || 'update'}`,
        summary: `Status pengiriman WhatsApp: ${st.status} (Recipient: ${st.recipient_id})`,
        metadata: {
          status: st.status,
          recipientId: st.recipient_id,
          timestamp: new Date().toISOString(),
        },
      })
    } else {
      await logAudit({
        action: 'whatsapp.webhook_received',
        summary: 'Menerima webhook masuk dari penyedia WhatsApp',
        metadata: {
          keys: Object.keys(body),
          timestamp: new Date().toISOString(),
        },
      })
    }
  } catch {
    // Non-blocking
  }

  logger.info('whatsapp.webhook.received', {
    route: 'api/whatsapp/webhook',
  })

  return NextResponse.json({ ok: true })
}
