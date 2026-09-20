import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { notifyClientContentReady } from '@/lib/telegram/service'
// eslint-disable-next-line no-restricted-imports
import { createClient } from '@supabase/supabase-js'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch { /* server component */ }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  // only admin may send
  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang bisa mengirim' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('deliverables')
    .update({ status: 'sent', updated_by: user.id })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: 'Deliverable tidak ditemukan' }, { status: 404 })

  // Kirim notifikasi Telegram ke klien secara asinkron jika terhubung
  if (data.client_id) {
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, telegram_chat_id, telegram_notifications_enabled')
      .eq('id', data.client_id)
      .single()

    if (client?.telegram_chat_id && client.telegram_notifications_enabled) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      notifyClientContentReady({
        clientChatId: client.telegram_chat_id,
        clientId: client.id,
        clientName: client.name,
        title: data.title,
        deliverableId: data.id,
        previewUrl: data.external_link || undefined,
      }, {
        onBlocked: async (recipientType, recipientId) => {
          if (recipientId && serviceRoleKey && supabaseUrl) {
            const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
            await supabaseAdmin
              .from('clients')
              .update({ telegram_notifications_enabled: false })
              .eq('id', recipientId)
          }
        },
      }).catch((notifyErr) => {
        console.error('[Telegram Notify Client Error]:', notifyErr)
      })
    }
  }

  return NextResponse.json({ success: true, data })
}
