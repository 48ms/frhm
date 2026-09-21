import { NextResponse } from 'next/server'
// eslint-disable-next-line no-restricted-imports
import { createClient } from '@supabase/supabase-js'
import { sendTelegramMessage } from '@/lib/telegram/service'
import { denyUnauthorized } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from?: {
      id: number
      is_bot: boolean
      first_name?: string
      username?: string
    }
    chat: {
      id: number | string
      first_name?: string
      title?: string
      type: string
    }
    text?: string
  }
}

export async function POST(request: Request) {
  // Verifikasi secret token Telegram webhook jika dikonfigurasi
  const configuredSecret = process.env.TELEGRAM_BOT_SECRET_TOKEN
  if (configuredSecret) {
    const receivedSecret = request.headers.get('x-telegram-bot-api-secret-token')
    if (receivedSecret !== configuredSecret) {
      console.warn('[Telegram Webhook] Invalid secret token')
      return denyUnauthorized()
    }
  }

  let body: TelegramUpdate
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const message = body.message
  if (!message || !message.text) {
    // Abaikan update tanpa teks (misal edit pesan, join message biasa)
    return NextResponse.json({ ok: true })
  }

  const chatId = String(message.chat.id)
  const username = message.from?.username || message.chat.title || message.from?.first_name || null
  const text = message.text.trim()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[Telegram Webhook] Supabase credentials tidak tersedia')
    return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // Tangani perintah /start
  if (text.startsWith('/start')) {
    const parts = text.split(' ')
    const startPayload = parts[1] // contoh: "client_123" atau "admin_456"

    if (!startPayload) {
      await sendTelegramMessage({
        chatId,
        text: [
          `<b>Selamat Datang di Frhm Notification Bot</b>`,
          ``,
          `Bot ini digunakan untuk mengirimkan notifikasi instan terkait materi konten, approval, dan status publikasi di platform Frhm.`,
          ``,
          `Untuk menghubungkan akun Anda, silakan buka menu <b>Portal Klien</b> atau <b>Pengaturan Admin</b> di Frhm dan klik tombol <i>Hubungkan Telegram</i>.`,
        ].join('\n'),
      })
      return NextResponse.json({ ok: true })
    }

    // Kasus 1: Penautan Akun Klien (client_<clientId>)
    if (startPayload.startsWith('client_')) {
      const clientId = startPayload.replace('client_', '')

      const { data: client, error: fetchErr } = await supabase
        .from('clients')
        .select('id, name')
        .eq('id', clientId)
        .single()

      if (fetchErr || !client) {
        await sendTelegramMessage({
          chatId,
          text: `Kode penautan klien tidak valid atau sudah tidak aktif. Silakan ulangi dari portal Frhm.`,
        })
        return NextResponse.json({ ok: true })
      }

      // Update clients table
      const { error: updateErr } = await supabase
        .from('clients')
        .update({
          telegram_chat_id: chatId,
          telegram_username: username,
          telegram_notifications_enabled: true,
        })
        .eq('id', clientId)

      if (updateErr) {
        console.error('[Telegram Webhook] Gagal memperbarui chat_id client:', updateErr)
        await sendTelegramMessage({
          chatId,
          text: `Terjadi kendala saat menyimpan koneksi Telegram. Silakan coba beberapa saat lagi.`,
        })
        return NextResponse.json({ ok: true })
      }

      // Kirim pesan konfirmasi sukses ke klien
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      await sendTelegramMessage({
        chatId,
        text: [
          `<b>Telegram Berhasil Terhubung!</b>`,
          ``,
          `Akun Telegram ini telah berhasil ditautkan dengan brand: <b>${client.name}</b>.`,
          ``,
          `Mulai sekarang, Anda akan menerima pemberitahuan otomatis di sini saat tim Frhm menyiapkan draft konten baru untuk Anda tinjau.`,
        ].join('\n'),
        buttons: [
          [
            {
              text: 'Buka Portal Frhm',
              url: `${appUrl}/app/client/deliverables`,
            },
          ],
        ],
        recipientType: 'client',
        recipientId: clientId,
        eventType: 'account_linked',
      })

      return NextResponse.json({ ok: true, linked: 'client', clientId })
    }

    // Kasus 2: Penautan Akun Admin (admin_<userId>)
    if (startPayload.startsWith('admin_')) {
      const adminUserId = startPayload.replace('admin_', '')

      const { data: user, error: fetchUserErr } = await supabase
        .from('users')
        .select('id, full_name, role')
        .eq('id', adminUserId)
        .eq('role', 'admin')
        .single()

      if (fetchUserErr || !user) {
        await sendTelegramMessage({
          chatId,
          text: `Kode penautan admin tidak valid. Silakan ulangi proses dari dashboard admin Frhm.`,
        })
        return NextResponse.json({ ok: true })
      }

      const { error: updateAdminErr } = await supabase
        .from('users')
        .update({
          telegram_chat_id: chatId,
          telegram_username: username,
          telegram_notifications_enabled: true,
        })
        .eq('id', adminUserId)

      if (updateAdminErr) {
        console.error('[Telegram Webhook] Gagal update chat_id admin:', updateAdminErr)
        return NextResponse.json({ ok: true })
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      await sendTelegramMessage({
        chatId,
        text: [
          `<b>Telegram Admin Berhasil Terhubung!</b>`,
          ``,
          `Halo <b>${user.full_name || 'Admin'}</b>, akun Telegram Anda telah aktif sebagai penerima peringatan operasional Frhm.`,
          ``,
          `Anda akan menerima notifikasi instan saat:`,
          `- Klien menyetujui konten atau meminta revisi`,
          `- Terjadi kendala pada cron publikasi terjadwal`,
        ].join('\n'),
        buttons: [
          [
            {
              text: 'Buka Dashboard Admin',
              url: `${appUrl}/app/admin/dashboard`,
            },
          ],
        ],
        recipientType: 'admin',
        recipientId: adminUserId,
        eventType: 'admin_linked',
      })

      return NextResponse.json({ ok: true, linked: 'admin', adminUserId })
    }
  }

  // Response default OK untuk event lainnya
  return NextResponse.json({ ok: true })
}
