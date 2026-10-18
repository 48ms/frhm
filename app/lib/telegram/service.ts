import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { createTelegramLinkToken } from '@/lib/telegram/link-token'
import { env } from '@/lib/env'

export interface TelegramButton {
  text: string
  url?: string
  callback_data?: string
}

export interface SendTelegramMessageOptions {
  chatId: string
  text: string
  parseMode?: 'HTML' | 'Markdown'
  buttons?: TelegramButton[][]
  disableWebPagePreview?: boolean
  recipientType?: 'client' | 'admin' | 'user'
  recipientId?: string
  eventType?: string
  /** Optional callback fired when Telegram returns 403 (bot blocked by user). Fire-and-forget, non-blocking. */
  onBlocked?: (recipientType: 'client' | 'admin' | 'user', recipientId?: string) => Promise<void>
}

export interface TelegramSendResult {
  success: boolean
  messageId?: number
  error?: string
}

export function getTelegramBotToken(): string | undefined {
  return env.server.TELEGRAM_BOT_TOKEN || undefined
}

export function getTelegramBotUsername(): string {
  return env.server.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'FrhmBot'
}

/**
 * Escape karakter spesial HTML untuk kepatuhan parser Telegram HTML entity.
 * Menghindari 400 Bad Request saat teks mengandung '&', '<', atau '>'.
 */
export function escapeTelegramHtml(text: string | null | undefined): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Buat deep link Telegram untuk menghubungkan akun client atau admin.
 * Payload memakai token bertanda tangan HMAC (bukan UUID mentah) agar pihak
 * lain tidak bisa membajak penautan dengan `/start client_<uuid>`.
 */
export function generateTelegramDeepLink(type: 'client' | 'admin', id: string): string {
  const username = getTelegramBotUsername().replace(/^@/, '')
  const token = createTelegramLinkToken(type, id)
  if (!token) {
    // Fail-closed: tanpa secret, jangan pernah hasilkan link dengan id mentah.
    return `https://t.me/${username}`
  }
  return `https://t.me/${username}?start=${encodeURIComponent(token)}`
}

/**
 * Kirim pesan teks ke Telegram Chat ID menggunakan REST API resmi Telegram.
 */
export async function sendTelegramMessage(
  options: SendTelegramMessageOptions
): Promise<TelegramSendResult> {
  const token = getTelegramBotToken()

  if (!token) {
    console.warn('[Telegram] TELEGRAM_BOT_TOKEN belum dikonfigurasi. Pengiriman pesan dilewati.')
    await logTelegramNotification({
      recipientType: options.recipientType || 'user',
      recipientId: options.recipientId,
      chatId: options.chatId,
      eventType: options.eventType || 'unknown',
      status: 'skipped',
      errorMessage: 'TELEGRAM_BOT_TOKEN not configured',
    })
    return {
      success: false,
      error: 'TELEGRAM_BOT_TOKEN belum dikonfigurasi.',
    }
  }

  const endpoint = `https://api.telegram.org/bot${token}/sendMessage`

  const payload: Record<string, unknown> = {
    chat_id: options.chatId,
    text: options.text,
    parse_mode: options.parseMode || 'HTML',
    disable_web_page_preview: options.disableWebPagePreview ?? false,
  }

  if (options.buttons && options.buttons.length > 0) {
    payload.reply_markup = {
      inline_keyboard: options.buttons,
    }
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok || !data.ok) {
      const errorMsg = data.description || `HTTP ${res.status}: Gagal mengirim pesan Telegram`
      console.error('[Telegram] Error pengiriman:', errorMsg)

      // Auto-disable on 403 (bot blocked by user)
      if (res.status === 403 && options.onBlocked) {
        try {
          await options.onBlocked(options.recipientType || 'user', options.recipientId)
        } catch {
          // Fire-and-forget: ignore callback errors
        }
      }

      await logTelegramNotification({
        recipientType: options.recipientType || 'user',
        recipientId: options.recipientId,
        chatId: options.chatId,
        eventType: options.eventType || 'unknown',
        status: 'failed',
        errorMessage: errorMsg,
      })

      return {
        success: false,
        error: errorMsg,
      }
    }

    await logTelegramNotification({
      recipientType: options.recipientType || 'user',
      recipientId: options.recipientId,
      chatId: options.chatId,
      eventType: options.eventType || 'unknown',
      status: 'sent',
    })

    return {
      success: true,
      messageId: data.result?.message_id,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown network error'
    console.error('[Telegram] Exception pengiriman:', errorMsg)

    await logTelegramNotification({
      recipientType: options.recipientType || 'user',
      recipientId: options.recipientId,
      chatId: options.chatId,
      eventType: options.eventType || 'unknown',
      status: 'failed',
      errorMessage: errorMsg,
    })

    return {
      success: false,
      error: errorMsg,
    }
  }
}

/**
 * Simpan catatan pengiriman notifikasi ke Supabase (non-blocking).
 */
async function logTelegramNotification(params: {
  recipientType: 'client' | 'admin' | 'user'
  recipientId?: string
  chatId: string
  eventType: string
  status: 'sent' | 'failed' | 'skipped'
  errorMessage?: string
}) {
  const supabaseUrl = env.server.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = env.server.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return

  try {
    const supabase = createSupabaseServiceClient()
    await supabase.from('telegram_notification_logs').insert({
      recipient_type: params.recipientType,
      recipient_id: params.recipientId || null,
      chat_id: params.chatId,
      event_type: params.eventType,
      status: params.status,
      error_message: params.errorMessage || null,
    })
  } catch {
    // Non-blocking: pencatatan log tidak boleh menggagalkan proses utama
  }
}

/**
 * Notifikasi untuk klien saat draft materi konten siap direview.
 */
export async function notifyClientContentReady(params: {
  clientChatId: string
  clientId: string
  clientName: string
  title: string
  deliverableId: string
  previewUrl?: string
  campaignTag?: string
}, options?: { onBlocked?: (recipientType: 'client' | 'admin' | 'user', recipientId?: string) => Promise<void> }) {
  const appUrl = env.server.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const reviewUrl = params.deliverableId
    ? `${appUrl}/review/${params.deliverableId}`
    : `${appUrl}/client/review?clientId=${params.clientId}`

  const lines = [
    `<b>Konten Baru Siap Direview</b>`,
    ``,
    `Halo tim <b>${escapeTelegramHtml(params.clientName)}</b>,`,
    `Materi konten baru telah selesai diproduksi dan siap untuk Anda tinjau:`,
    ``,
    `<b>Judul:</b> ${escapeTelegramHtml(params.title)}`,
    params.campaignTag ? `<b>Kampanye:</b> ${escapeTelegramHtml(params.campaignTag)}` : '',
    ``,
    `Silakan buka portal Frhm untuk memberikan persetujuan atau catatan revisi.`,
  ].filter(Boolean).join('\n')

  const buttons: TelegramButton[][] = [
    [
      {
        text: 'Buka Portal Review',
        url: reviewUrl,
      },
    ],
  ]

  if (params.previewUrl) {
    buttons[0].push({
      text: 'Lihat File Media',
      url: params.previewUrl,
    })
  }

  return sendTelegramMessage({
    chatId: params.clientChatId,
    text: lines,
    buttons,
    recipientType: 'client',
    recipientId: params.clientId,
    eventType: 'content_ready_for_review',
    onBlocked: options?.onBlocked,
  })
}

/**
 * Notifikasi untuk admin saat klien menyetujui atau meminta revisi konten.
 */
export async function notifyAdminClientFeedback(params: {
  adminChatId?: string
  adminId?: string
  clientName: string
  title: string
  action: 'approved' | 'revision_requested'
  notes?: string
  deliverableId: string
  campaignTag?: string
}, options?: { onBlocked?: (recipientType: 'client' | 'admin' | 'user', recipientId?: string) => Promise<void> }) {
  const appUrl = env.server.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const adminUrl = `${appUrl}/admin/erp`

  const isApproved = params.action === 'approved'
  const statusIcon = isApproved ? '[DISETUJUI]' : '[PERMINTAAN REVISI]'
  const titleHeader = isApproved
    ? `<b>Klien Menyetujui Konten</b>`
    : `<b>Klien Meminta Revisi Konten</b>`

  const lineList = [
    `${statusIcon} ${titleHeader}`,
    ``,
    `<b>Brand:</b> ${escapeTelegramHtml(params.clientName)}`,
    `<b>Konten:</b> ${escapeTelegramHtml(params.title)}`,
    params.campaignTag ? `<b>Kampanye:</b> ${escapeTelegramHtml(params.campaignTag)}` : '',
  ].filter(Boolean)

  if (params.notes && !isApproved) {
    lineList.push(``, `<b>Catatan Revisi:</b>`, `<i>${escapeTelegramHtml(params.notes)}</i>`)
  }

  lineList.push(``, `Segera periksa rincian pada dashboard admin.`)

  const buttons: TelegramButton[][] = [
    [
      {
        text: 'Lihat di Dashboard Admin',
        url: adminUrl,
      },
    ],
  ]

  const targetChatId = params.adminChatId || env.server.TELEGRAM_ADMIN_CHAT_ID
  if (!targetChatId) {
    return { success: false, error: 'TELEGRAM_ADMIN_CHAT_ID not configured' }
  }

  return sendTelegramMessage({
    chatId: targetChatId,
    text: lineList.join('\n'),
    buttons,
    recipientType: 'admin',
    recipientId: params.adminId,
    eventType: isApproved ? 'client_approved' : 'client_revision_requested',
    onBlocked: options?.onBlocked,
  })
}

/**
 * Notifikasi untuk admin saat proses publikasi konten terjadwal selesai atau menemui kendala.
 * Diperkaya dengan campaign_tag, external_post_id, published_at, dan hint aksi untuk gagal.
 */
export async function notifyAdminPublishStatus(params: {
  adminChatId?: string
  clientName?: string
  title: string
  platform: string
  status: 'success' | 'failed'
  error?: string
  campaignTag?: string
  externalPostId?: string
  publishedAt?: string
  scheduledAt?: string
}, options?: { onBlocked?: (recipientType: 'client' | 'admin' | 'user', recipientId?: string) => Promise<void> }) {
  const isSuccess = params.status === 'success'
  const statusIcon = isSuccess ? '[BERHASIL]' : '[PERINGATAN GAGAL]'

  const lines = [
    `${statusIcon} <b>Laporan Publikasi Konten Terjadwal</b>`,
    ``,
    `<b>Platform:</b> ${escapeTelegramHtml(params.platform)}`,
    `<b>Konten:</b> ${escapeTelegramHtml(params.title)}`,
  ]

  if (params.clientName) {
    lines.push(`<b>Brand:</b> ${escapeTelegramHtml(params.clientName)}`)
  }
  if (params.campaignTag) {
    lines.push(`<b>Kampanye:</b> ${escapeTelegramHtml(params.campaignTag)}`)
  }
  if (isSuccess && params.externalPostId) {
    lines.push(`<b>Post ID:</b> <code>${escapeTelegramHtml(params.externalPostId)}</code>`)
  }
  if (isSuccess && params.publishedAt) {
    lines.push(`<b>Waktu Publikasi:</b> ${new Date(params.publishedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`)
  }

  if (!isSuccess) {
    lines.push(``, `—`, ``)
    lines.push(`<b>Penyebab Kendala:</b>`, `<code>${escapeTelegramHtml(params.error || 'Unknown error')}</code>`)
    if (params.scheduledAt) {
      lines.push(`<b>Jadwal Asli:</b> ${new Date(params.scheduledAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`)
    }
    lines.push(``, `Metrik akan <b>0</b> untuk slot ini. Butuh keputusan manual:`)
    lines.push(`• Tunda 1 hari`)
    lines.push(`• Posting ulang manual`)
  }

  const targetChatId = params.adminChatId || env.server.TELEGRAM_ADMIN_CHAT_ID
  if (!targetChatId) {
    return { success: false, error: 'TELEGRAM_ADMIN_CHAT_ID not configured' }
  }

  const buttons: TelegramButton[][] = isSuccess ? [] : [[
    { text: 'Tunda 1 Hari', callback_data: `publish_defer_${params.title}` },
    { text: 'Posting Ulang', callback_data: `publish_retry_${params.title}` },
  ]]

  return sendTelegramMessage({
    chatId: targetChatId,
    text: lines.filter(Boolean).join('\n'),
    buttons: buttons.length > 0 ? buttons : undefined,
    recipientType: 'admin',
    eventType: isSuccess ? 'publish_scheduled_success' : 'publish_scheduled_failed',
    onBlocked: options?.onBlocked,
  })
}

/**
 * Notifikasi eskalasi: konten sudah tayang 24 jam tapi metrik masih 0.
 * Dipanggil oleh cron job check-zero-metrics.
 */
export async function notifyZeroMetricsEscalation(params: {
  adminChatId?: string
  clientName: string
  clientId?: string
  title: string
  platform: string
  publishedAt: string
  campaignTag?: string
}, options?: { onBlocked?: (recipientType: 'client' | 'admin' | 'user', recipientId?: string) => Promise<void> }) {
  const lines = [
    `[ESKALASI] <b>Metrik Nol 24 Jam Pasca-Publish</b>`,
    ``,
    `<b>Brand:</b> ${escapeTelegramHtml(params.clientName)}`,
    `<b>Konten:</b> ${escapeTelegramHtml(params.title)}`,
    `<b>Platform:</b> ${escapeTelegramHtml(params.platform)}`,
    params.campaignTag ? `<b>Kampanye:</b> ${escapeTelegramHtml(params.campaignTag)}` : '',
    `<b>Dipublikasikan:</b> ${new Date(params.publishedAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`,
    ``,
    `Postingan sudah tayang <b>24 jam</b> lalu tapi <b>metrik masih 0</b> (reach, likes, comments, shares, saves, clicks).`,
    ``,
    `Kemungkinan penyebab:`,
    `• Konten tidak terpublish (cek native platform)`,
    `• Metrik belum tersinkron (input manual diperlukan)`,
    `• Konten di-shadowban / filtered`,
    ``,
    `Tindakan: cek native analytics IG/TikTok & input manual metrik di dashboard Frhm.`,
  ].filter(Boolean).join('\n')

  const targetChatId = params.adminChatId || env.server.TELEGRAM_ADMIN_CHAT_ID
  if (!targetChatId) {
    return { success: false, error: 'TELEGRAM_ADMIN_CHAT_ID not configured' }
  }

  const buttons: TelegramButton[][] = [[
    { text: 'Buka Analytics Board', url: `${env.server.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/analytics?clientId=${params.clientId}` },
  ]]

  return sendTelegramMessage({
    chatId: targetChatId,
    text: lines,
    buttons,
    recipientType: 'admin',
    eventType: 'zero_metrics_escalation',
    onBlocked: options?.onBlocked,
  })
}

/**
 * Notifikasi pengingat H-1 / hari H untuk konten yang akan tayang.
 */
export async function notifyClientReminder(params: {
  clientChatId: string
  clientId: string
  clientName: string
  title: string
  platform: string
  scheduledAt: string
  campaignTag?: string
}, options?: { onBlocked?: (recipientType: 'client' | 'admin' | 'user', recipientId?: string) => Promise<void> }) {
  const appUrl = env.server.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const calendarUrl = `${appUrl}/client/calendar?clientId=${params.clientId}`

  const dateStr = new Date(params.scheduledAt).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const lines = [
    `🔔 <b>Pengingat Jadwal Tayang</b>`,
    ``,
    `Halo tim <b>${escapeTelegramHtml(params.clientName)}</b>,`,
    `Terdapat postingan yang dijadwalkan tayang pada <b>${dateStr}</b>:`,
    ``,
    `<b>Judul:</b> ${escapeTelegramHtml(params.title)}`,
    `<b>Platform:</b> ${escapeTelegramHtml(params.platform)}`,
    params.campaignTag ? `<b>Kampanye:</b> ${escapeTelegramHtml(params.campaignTag)}` : '',
    ``,
    `Silakan pastikan aset final sudah siap.`,
  ].filter(Boolean).join('\n')

  const buttons: TelegramButton[][] = [
    [{ text: 'Lihat Kalender', url: calendarUrl }],
  ]

  return sendTelegramMessage({
    chatId: params.clientChatId,
    text: lines,
    buttons,
    recipientType: 'client',
    recipientId: params.clientId,
    eventType: 'publish_reminder',
    onBlocked: options?.onBlocked,
  })
}

/**
 * Notifikasi threshold budget ERP (saat pengeluaran mencapai atau melebihi 90% dari total alokasi budget).
 */
export async function notifyBudgetThresholdAlert(params: {
  adminChatId?: string
  clientName: string
  clientId: string
  totalBudget: number
  remainingBalance: number
  spentPercentage: number
  expenseAmount: number
  category?: string | null
}, options?: { onBlocked?: (recipientType: 'client' | 'admin' | 'user', recipientId?: string) => Promise<void> }) {
  const appUrl = env.server.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const erpUrl = `${appUrl}/admin/erp?clientId=${params.clientId}`

  const isExceeded = params.remainingBalance <= 0 || params.spentPercentage >= 100
  const alertIcon = isExceeded ? '🚨 [OVERBUDGET]' : '⚠️ [AMBANG BATAS 90%]'
  const titleHeader = isExceeded
    ? '<b>Peringatan: Alokasi Budget Terlampaui (100%+)</b>'
    : '<b>Peringatan: Pengeluaran Telah Mencapai 90% Budget</b>'

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

  const lines = [
    `${alertIcon} ${titleHeader}`,
    ``,
    `<b>Brand / Klien:</b> ${escapeTelegramHtml(params.clientName)}`,
    `<b>Nominal Biaya Baru:</b> ${formatRupiah(params.expenseAmount)} ${params.category ? `(${escapeTelegramHtml(params.category)})` : ''}`,
    `<b>Total Alokasi Budget:</b> ${formatRupiah(params.totalBudget)}`,
    `<b>Sisa Saldo:</b> ${formatRupiah(params.remainingBalance)}`,
    `<b>Realisasi Anggaran:</b> <b>${params.spentPercentage.toFixed(1)}%</b>`,
    ``,
    isExceeded
      ? 'Pengeluaran ini telah menghabiskan seluruh sisa budget klien. Segera tinjau alokasi tambahan di ERP.'
      : 'Budget bulanan klien hampir habis (tersisa kurang dari 10%). Harap pantau pengeluaran iklan dan operasional.',
  ].filter(Boolean).join('\n')

  const targetChatId = params.adminChatId || env.server.TELEGRAM_ADMIN_CHAT_ID
  if (!targetChatId) {
    return { success: false, error: 'TELEGRAM_ADMIN_CHAT_ID not configured' }
  }

  const buttons: TelegramButton[][] = [
    [{ text: 'Buka Dashboard ERP', url: erpUrl }],
  ]

  return sendTelegramMessage({
    chatId: targetChatId,
    text: lines,
    buttons,
    recipientType: 'admin',
    eventType: 'budget_threshold_alert',
    onBlocked: options?.onBlocked,
  })
}