import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTelegramMessage } from '@/lib/telegram/service'
import { denyUnauthorized } from '@/lib/auth/guard'
import { logAudit } from '@/lib/audit/log'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // Throttle: this route sends a real Telegram message, so cap it to avoid spam.
  const rl = checkRateLimit(getClientIp(request.headers), 'telegram/test', RATE_LIMITS.mutation.limit, RATE_LIMITS.mutation.windowMs)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return denyUnauthorized()
  }

  // Cek apakah user adalah admin
  const { data: userProfile, error: profileErr } = await supabase
    .from('users')
    .select('role, telegram_chat_id, full_name')
    .eq('id', user.id)
    .single()

  if (profileErr || userProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Hanya admin yang dapat menjalankan uji coba' }, { status: 403 })
  }

  let body: { chatId?: string; message?: string } = {}
  try {
    body = await request.json()
  } catch {
    // optional body
  }

  const targetChatId = body.chatId || userProfile.telegram_chat_id

  if (!targetChatId) {
    return NextResponse.json(
      {
        error:
          'Chat ID tujuan belum ditentukan dan akun admin Anda belum menghubungkan Telegram.',
      },
      { status: 400 }
    )
  }

  const customText =
    body.message ||
    [
      `<b>Uji Coba Notifikasi Telegram Frhm</b>`,
      ``,
      `Halo <b>${userProfile.full_name || 'Admin'}</b>,`,
      `Koneksi Telegram Bot Frhm berfungsi dengan normal dan siap mengirimkan notifikasi.`,
      ``,
      `<i>Waktu server: ${new Date().toLocaleString('id-ID')}</i>`,
    ].join('\n')

  const result = await sendTelegramMessage({
    chatId: targetChatId,
    text: customText,
    recipientType: 'admin',
    recipientId: user.id,
    eventType: 'admin_test_ping',
  })

  void logAudit({
    action: 'telegram.test',
    actorId: user.id,
    summary: `Admin test notifikasi ke chat ${targetChatId}`,
    request,
  })

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    chatId: targetChatId,
    messageId: result.messageId,
  })
}
