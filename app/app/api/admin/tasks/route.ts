import { NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'

export const dynamic = 'force-dynamic'

/**
 * Update a task by id (admin-only).
 *
 * PATCH /api/admin/tasks
 *   body: { id: string, action: 'mark_done' | 'reschedule', due_date?: string }
 */
export async function PATCH(req: Request) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const { id, action, due_date } = await req.json()

  if (!id || !action) {
    return NextResponse.json({ error: 'id dan action wajib diisi' }, { status: 400 })
  }

  if (action === 'mark_done') {
    const { error } = await supabase.from('tasks').update({ status: 'completed' }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (action === 'reschedule' && due_date) {
    const { error } = await supabase
      .from('tasks')
      .update({ due_date: new Date(due_date).toISOString() })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    return NextResponse.json({ error: 'action tidak valid' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
