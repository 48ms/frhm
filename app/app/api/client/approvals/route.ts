import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logAudit } from '@/lib/audit/log'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) {
          try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const body = await req.json().catch(() => ({}))
  const { action } = body // 'approve' or 'reject'
  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('platform_posts').select('status').eq('id', id).single()

  if (!existing || existing.status !== 'InReview') {
    return NextResponse.json({ error: 'Post harus dalam status InReview' }, { status: 400 })
  }

  const newStatus = action === 'approve' ? 'Approved' : 'Draft'

  const { data, error } = await supabase
    .from('platform_posts')
    .update({ status: newStatus })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  void logAudit({
    action: action === 'approve' ? 'client.approve' : 'client.reject',
    actorId: user.id,
    entityType: 'platform_post',
    entityId: id,
    summary: `Client ${action === 'approve' ? 'menyetujui' : 'menolak/revisi'} konten platform`,
    request: req,
  })

  return NextResponse.json({ data })
}
