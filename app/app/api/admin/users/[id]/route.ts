import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'

export const dynamic = 'force-dynamic'

/** PATCH update user role, name, client_id */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { full_name, role, client_id } = body

  if (id === user.id && role && role !== 'admin') {
    return NextResponse.json({ error: 'Tidak bisa mengubah role diri sendiri' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (full_name !== undefined) updates.full_name = full_name
  if (role !== undefined) updates.role = role
  if (client_id !== undefined) updates.client_id = role === 'client' ? client_id : null

  const { error } = await supabase.from('users').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If role changed to client but no client_id, or role changed to admin, sync auth metadata
  if (role) {
    await supabase.auth.admin.updateUserById(id, { user_metadata: { role } })
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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (id === user.id) {
    return NextResponse.json({ error: 'Tidak bisa menghapus diri sendiri' }, { status: 400 })
  }

  // Delete from auth (cascades to public.users via trigger or manual)
  const { error: authError } = await supabase.auth.admin.deleteUser(id)
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

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