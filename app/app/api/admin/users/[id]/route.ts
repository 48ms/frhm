import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { logAudit } from '@/lib/audit/log'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

function serviceClient() {
  return createSupabaseServiceClient()
}

/** PATCH update user role, name, client_id */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = checkRateLimit(getClientIp(request.headers), 'admin/users', RATE_LIMITS.mutation.limit, RATE_LIMITS.mutation.windowMs)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi dalam beberapa detik.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return denyForbidden({ userId: user.id, role: profile?.role })

  const body = await request.json()
  const { full_name, role, client_id } = body

  if (id === user.id && role && role !== 'admin') {
    return NextResponse.json({ error: 'Tidak bisa mengubah role diri sendiri' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (full_name !== undefined) updates.full_name = full_name
  if (role !== undefined) updates.role = role
  if (client_id !== undefined) updates.client_id = role === 'client' ? client_id : null

  const svc = serviceClient()
  const { error } = await svc.from('users').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Sync role into auth user_metadata (service-role required)
  if (role) {
    await svc.auth.admin.updateUserById(id, { user_metadata: { role } })
  }

  void logAudit({
    action: role ? 'user.role_change' : 'user.update',
    actorId: user.id,
    actorRole: profile?.role ?? null,
    entityType: 'user',
    entityId: id,
    summary: role ? `Mengubah role user ${id} → ${role}` : `Memperbarui data user ${id}`,
    metadata: { changes: updates },
    request,
  })

  return NextResponse.json({ success: true })
}

/** DELETE user */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return denyForbidden({ userId: user.id, role: profile?.role })

  if (id === user.id) {
    return NextResponse.json({ error: 'Tidak bisa menghapus diri sendiri' }, { status: 400 })
  }

  // Delete from auth.users (service-role required)
  const svc = serviceClient()
  const { error: authError } = await svc.auth.admin.deleteUser(id)
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  // Also delete from public.users
  const { error: dbError } = await svc.from('users').delete().eq('id', id)
  if (dbError) {
    console.error('[admin/users/delete] auth deleted but public.users still has row:', dbError.message)
  }

  void logAudit({
    action: 'user.delete',
    actorId: user.id,
    actorRole: profile?.role ?? null,
    entityType: 'user',
    entityId: id,
    summary: `Menghapus user ${id}`,
    request,
  })

  return NextResponse.json({ success: true })
}
