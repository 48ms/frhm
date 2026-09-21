import { NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'

export const dynamic = 'force-dynamic'

/**
 * Mark a task as completed or update its due date.
 *
 * POST /api/admin/clients/[id]/tasks/:action
 *   body: { id: string, action: 'mark_done' | 'reschedule', due_date?: string }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const clientId = (await params).id
  const { id: taskId, action, due_date } = await req.json()

  if (!taskId || !action) {
    return NextResponse.json({ error: 'taskId dan action wajib diisi' }, { status: 400 })
  }

  // Verify the task belongs to this client.
  const { data: task } = await supabase
    .from('tasks')
    .select('id, client_id')
    .eq('id', taskId)
    .eq('client_id', clientId)
    .maybeSingle()

  if (!task) {
    return NextResponse.json({ error: 'Task tidak ditemukan untuk klien ini' }, { status: 404 })
  }

  let error: Error | null
  if (action === 'mark_done') {
    const result = await supabase
      .from('tasks')
      .update({ status: 'completed' })
      .eq('id', taskId)
      .select()
      .single()
    error = result.error
  } else if (action === 'reschedule' && due_date) {
    const result = await supabase
      .from('tasks')
      .update({ due_date: new Date(due_date).toISOString() })
      .eq('id', taskId)
      .select()
      .single()
    error = result.error
  } else {
    return NextResponse.json({ error: 'action tidak valid' }, { status: 400 })
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}