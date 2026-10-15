import { NextResponse } from 'next/server'
import {
  verifyWhatsAppWebhookGet,
  verifyWhatsAppWebhookPost,
} from '@/lib/whatsapp/verify-webhook'
import { logger } from '@/lib/logger'
import { logAudit } from '@/lib/audit/log'

export const dynamic = 'force-dynamic'

/**
 * GET Handler: Handshake verifikasi webhook Meta WhatsApp Cloud API
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN

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

  const configuredSecret = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN

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

  // Catat event status/pesan masuk ke audit log jika relevan
  try {
    await logAudit({
      action: 'whatsapp.webhook_received',
      summary: 'Menerima webhook masuk dari penyedia WhatsApp',
      metadata: {
        keys: Object.keys(body),
        timestamp: new Date().toISOString(),
      },
    })
  } catch {
    // Non-blocking
  }

  logger.info('whatsapp.webhook.received', {
    route: 'api/whatsapp/webhook',
  })

  return NextResponse.json({ ok: true })
}
