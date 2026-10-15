import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { env } from '@/lib/env'

export interface SendWhatsAppOptions {
  phone: string
  text: string
  recipientType?: 'client' | 'admin' | 'user'
  recipientId?: string
  deliverableId?: string
  eventType?: string
}

export interface WhatsAppSendResult {
  success: boolean
  clickUrl: string
  status: 'sent' | 'ready' | 'failed' | 'skipped'
  messageId?: string
  error?: string
}

/**
 * Normalisasi format nomor telepon ke format internasional E.164 tanpa tanda plus (contoh: 6281234567890).
 */
export function normalizeWhatsAppPhone(rawPhone: string): string {
  if (!rawPhone) return ''

  // Hapus semua karakter non-angka
  let cleaned = rawPhone.trim().replace(/\D/g, '')

  // Jika berawalan '0', ganti dengan kode negara Indonesia '62'
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1)
  } else if (cleaned.startsWith('8')) {
    // Seringkali user hanya menulis 812xxxx
    cleaned = '62' + cleaned
  }

  return cleaned
}

/**
 * Buat tautan WhatsApp Click-to-Chat resmi (`https://wa.me/<phone>?text=<encoded>`).
 */
export function generateWhatsAppClickToChat(phone: string, text: string): string {
  const normalizedPhone = normalizeWhatsAppPhone(phone)
  const encodedText = encodeURIComponent(text)
  if (!normalizedPhone) {
    return `https://wa.me/?text=${encodedText}`
  }
  return `https://wa.me/${normalizedPhone}?text=${encodedText}`
}

/**
 * Format pesan notifikasi review konten klien yang ramah, profesional, dan bebas jargon kaku.
 */
export function formatReviewNotificationMessage(params: {
  clientName: string
  title: string
  reviewUrl: string
  previewUrl?: string
  campaignTag?: string
}): string {
  const lines = [
    `Halo tim *${params.clientName}*,`,
    ``,
    `Materi konten baru telah selesai diproduksi dan siap untuk Anda tinjau:`,
    `📌 *Judul:* ${params.title}`,
    params.campaignTag ? `🏷️ *Kampanye:* ${params.campaignTag}` : '',
    ``,
    `Silakan buka portal review untuk memeriksa materi, memberikan catatan revisi, atau langsung menyetujui:`,
    `👉 ${params.reviewUrl}`,
    params.previewUrl ? `\n🔗 *File Media:* ${params.previewUrl}` : '',
    ``,
    `Terima kasih.`,
    `_Frhm Creative Ops_`,
  ].filter(Boolean)

  return lines.join('\n')
}

/**
 * Kirim notifikasi WhatsApp via Cloud API / Webhook jika tersedia,
 * atau siapkan tautan Click-to-Chat siap pakai untuk admin/operator.
 */
export async function sendWhatsAppNotification(
  options: SendWhatsAppOptions
): Promise<WhatsAppSendResult> {
  const normalizedPhone = normalizeWhatsAppPhone(options.phone)
  const clickUrl = generateWhatsAppClickToChat(options.phone, options.text)

  if (!normalizedPhone) {
    const errorMsg = 'Nomor WhatsApp tujuan tidak valid atau kosong.'
    await logWhatsAppNotification({
      recipientType: options.recipientType || 'client',
      recipientId: options.recipientId,
      phone: options.phone || 'unknown',
      eventType: options.eventType || 'unknown',
      status: 'failed',
      message: options.text,
      clickUrl,
      errorMessage: errorMsg,
    })
    return {
      success: false,
      clickUrl,
      status: 'failed',
      error: errorMsg,
    }
  }

  const apiToken = env.server.WHATSAPP_API_TOKEN
  const phoneNumberId = env.server.WHATSAPP_PHONE_NUMBER_ID
  const customWebhookUrl = env.server.WHATSAPP_WEBHOOK_URL

  // Skenario A: Meta WhatsApp Business Cloud API terkonfigurasi
  if (apiToken && phoneNumberId) {
    try {
      const endpoint = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'text',
          text: {
            preview_url: true,
            body: options.text,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errorMsg = data.error?.message || `WhatsApp API error (${res.status})`
        await logWhatsAppNotification({
          recipientType: options.recipientType || 'client',
          recipientId: options.recipientId,
          phone: normalizedPhone,
          eventType: options.eventType || 'unknown',
          status: 'failed',
          message: options.text,
          clickUrl,
          errorMessage: errorMsg,
        })
        return {
          success: false,
          clickUrl,
          status: 'failed',
          error: errorMsg,
        }
      }

      const messageId = data.messages?.[0]?.id

      await logWhatsAppNotification({
        recipientType: options.recipientType || 'client',
        recipientId: options.recipientId,
        phone: normalizedPhone,
        eventType: options.eventType || 'unknown',
        status: 'sent',
        message: options.text,
        clickUrl,
      })

      return {
        success: true,
        clickUrl,
        status: 'sent',
        messageId,
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Network error saat menghubungi WhatsApp Cloud API'
      await logWhatsAppNotification({
        recipientType: options.recipientType || 'client',
        recipientId: options.recipientId,
        phone: normalizedPhone,
        eventType: options.eventType || 'unknown',
        status: 'failed',
        message: options.text,
        clickUrl,
        errorMessage: errorMsg,
      })
      return {
        success: false,
        clickUrl,
        status: 'failed',
        error: errorMsg,
      }
    }
  }

  // Skenario B: Custom Webhook URL terkonfigurasi (contoh: n8n, Make, Twilio gateway)
  if (customWebhookUrl) {
    try {
      const res = await fetch(customWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: normalizedPhone,
          message: options.text,
          eventType: options.eventType,
          deliverableId: options.deliverableId,
          recipientId: options.recipientId,
          recipientType: options.recipientType,
        }),
      })

      if (!res.ok) {
        const errorMsg = `Custom Webhook error (${res.status})`
        await logWhatsAppNotification({
          recipientType: options.recipientType || 'client',
          recipientId: options.recipientId,
          phone: normalizedPhone,
          eventType: options.eventType || 'unknown',
          status: 'failed',
          message: options.text,
          clickUrl,
          errorMessage: errorMsg,
        })
        return {
          success: false,
          clickUrl,
          status: 'failed',
          error: errorMsg,
        }
      }

      await logWhatsAppNotification({
        recipientType: options.recipientType || 'client',
        recipientId: options.recipientId,
        phone: normalizedPhone,
        eventType: options.eventType || 'unknown',
        status: 'sent',
        message: options.text,
        clickUrl,
      })

      return {
        success: true,
        clickUrl,
        status: 'sent',
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Network error saat dispatch webhook'
      await logWhatsAppNotification({
        recipientType: options.recipientType || 'client',
        recipientId: options.recipientId,
        phone: normalizedPhone,
        eventType: options.eventType || 'unknown',
        status: 'failed',
        message: options.text,
        clickUrl,
        errorMessage: errorMsg,
      })
      return {
        success: false,
        clickUrl,
        status: 'failed',
        error: errorMsg,
      }
    }
  }

  // Skenario C: Mode Standar Direct Click-to-Chat (Siap 1-klik buka WhatsApp Web / Aplikasi)
  await logWhatsAppNotification({
    recipientType: options.recipientType || 'client',
    recipientId: options.recipientId,
    phone: normalizedPhone,
    eventType: options.eventType || 'unknown',
    status: 'ready',
    message: options.text,
    clickUrl,
  })

  return {
    success: true,
    clickUrl,
    status: 'ready',
  }
}

/**
 * Catat riwayat pengiriman notifikasi WhatsApp ke database (non-blocking).
 */
async function logWhatsAppNotification(params: {
  recipientType: 'client' | 'admin' | 'user'
  recipientId?: string
  phone: string
  eventType: string
  status: 'sent' | 'failed' | 'skipped' | 'ready'
  message?: string
  clickUrl?: string
  errorMessage?: string
}) {
  const supabaseUrl = env.server.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = env.server.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return

  try {
    const supabase = createSupabaseServiceClient()
    await supabase.from('whatsapp_notification_logs').insert({
      recipient_type: params.recipientType,
      recipient_id: params.recipientId || null,
      phone: params.phone,
      event_type: params.eventType,
      status: params.status,
      message: params.message || null,
      click_url: params.clickUrl || null,
      error_message: params.errorMessage || null,
    })
  } catch {
    // Non-blocking: pencatatan log tidak boleh menggagalkan proses utama
  }
}
