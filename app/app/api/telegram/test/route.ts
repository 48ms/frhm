import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTelegramMessage } from '@/lib/telegram/service'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
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

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    chatId: targetChatId,
    messageId: result.messageId,
  })
}
