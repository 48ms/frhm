import { NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'

export const dynamic = 'force-dynamic'

// Fetch all event_tasks for a given event (global admin route, event scoped)
export async function GET(
  req: Request,
  { params }: { params: { clientId: string } },
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')

  if (!eventId) {
    return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('event_tasks')
    .select('id, title, is_completed, stage')
    .eq('event_id', eventId)
    .order('created_at')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ tasks: data ?? [] })
}

// Toggle event_task completion (global admin route, task-scoped)
export async function PATCH(
  req: Request,
  { params }: { params: { clientId: string } },
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const { searchParams } = new URL(req.url)
  const taskId = searchParams.get('task_id')

  if (!taskId) {
    return NextResponse.json({ error: 'task_id required' }, { status: 400 })
  }

  const { is_completed } = await req.json()

  if (typeof is_completed !== 'boolean') {
    return NextResponse.json({ error: 'is_completed wajib boolean' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('event_tasks')
    .update({ is_completed })
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Task tidak ditemukan' }, { status: 404 })
  }

  return NextResponse.json({ task: data })
}
