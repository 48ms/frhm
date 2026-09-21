import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit/log'
import { notifyAdminClientFeedback } from '@/lib/telegram/service'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

/**
 * Patch skill_outputs with service-role client to bypass the SELECT-only RLS policy
 * (`so_client_own`). We still validate ownership first via `users` table so the
 * service-role write is gated behind an auth check, not open to any caller.
 */
async function patchSkillOutputsByDeliverable(id: string, body: { status: string }) {
  const srv = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  await srv.from('skill_outputs').update(body).eq('deliverable_id', id)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

  const body = await request.json().catch(() => ({}))
  const reason: string = body?.reason ?? ''
  if (!reason.trim()) {
    return NextResponse.json({ error: 'Alasan revisi wajib diisi' }, { status: 400 })
  }

  // resolve the client_id of the signed-in user
  const { data: profile } = await supabase
    .from('users').select('client_id, full_name').eq('id', user.id).single()
  if (!profile?.client_id) {
    return NextResponse.json({ error: 'Akun tidak terhubung ke client' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('deliverables')
    .update({ status: 'revision_requested', updated_by: user.id })
    .eq('id', (await params).id)
    .eq('client_id', profile.client_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // the linked skill output mirrors the deliverable — revision means the work goes back for edits
  // Use service-role client because `so_client_own` RLS policy on skill_outputs is FOR
  // SELECT only; a direct client JWT call would silently update 0 rows.
  await patchSkillOutputsByDeliverable((await params).id, { status: 'revision_requested' })

  // log the reason as a comment on the thread
  await supabase.from('deliverable_comments').insert({
    deliverable_id: (await params).id,
    author_id: user.id,
    content: `[REVISI DIMINTA]: ${reason.trim()}`,
  })

  await logAudit({
    actorId: user.id,
    actorRole: 'client',
    actorName: profile.full_name,
    action: 'deliverable.revision_request',
    entityType: 'deliverable',
    entityId: (await params).id,
    clientId: profile.client_id,
    summary: `Klien meminta revisi "${data?.title ?? 'deliverable'}"`,
    metadata: { title: data?.title ?? null, reason: reason.trim() },
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
          action: 'revision_requested',
          notes: reason.trim(),
          deliverableId: (await params).id,
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
          console.error('[Telegram Notify Admin Revision Error]:', notifyErr)
        })
      }
    }
  }

  return NextResponse.json({ success: true, data })
}