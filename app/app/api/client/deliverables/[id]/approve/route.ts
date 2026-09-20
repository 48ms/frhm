import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit/log'
import { notifyAdminClientFeedback } from '@/lib/telegram/service'
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

  const { data: profile } = await supabase
    .from('users').select('client_id, full_name').eq('id', user.id).single()
  if (!profile?.client_id) {
    return NextResponse.json({ error: 'Akun tidak terhubung ke client' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('deliverables')
    .update({ status: 'approved', approved_at: new Date().toISOString(), updated_by: user.id })
    .eq('id', params.id)
    .eq('client_id', profile.client_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // the linked skill output mirrors the deliverable — an approved deliverable means its work is
  // finished and ready to publish (the repo: "the agent drafts, the human judges")
  await supabase.from('skill_outputs').update({ status: 'approved' }).eq('deliverable_id', params.id)

  await logAudit({
    actorId: user.id,
    actorRole: 'client',
    actorName: profile.full_name,
    action: 'deliverable.approve',
    entityType: 'deliverable',
    entityId: params.id,
    clientId: profile.client_id,
    summary: `Klien menyetujui "${data?.title ?? 'deliverable'}"`,
    metadata: { title: data?.title ?? null },
  })

  // Kirim notifikasi Telegram ke Admin Frhm secara asinkron
  const { data: admins } = await supabase
    .from('users')
    .select('id, telegram_chat_id')
    .eq('role', 'admin')
    .eq('telegram_notifications_enabled', true)
    .not('telegram_chat_id', 'is', null)

  const { data: clientObj } = await supabase
    .from('clients')
    .select('name')
    .eq('id', profile.client_id)
    .single()

  if (admins && admins.length > 0) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    for (const adm of admins) {
      if (adm.telegram_chat_id) {
        notifyAdminClientFeedback({
          adminChatId: adm.telegram_chat_id,
          adminId: adm.id,
          clientName: clientObj?.name || 'Klien',
          title: data?.title || 'Deliverable',
          action: 'approved',
          deliverableId: params.id,
        }, {
          onBlocked: async (recipientType, recipientId) => {
            if (recipientId && serviceRoleKey && supabaseUrl) {
              const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
              await supabaseAdmin
                .from('users')
                .update({ telegram_notifications_enabled: false })
                .eq('id', recipientId)
            }
          },
        }).catch((notifyErr) => {
          console.error('[Telegram Notify Admin Approve Error]:', notifyErr)
        })
      }
    }
  }

  return NextResponse.json({ success: true, data })
}
