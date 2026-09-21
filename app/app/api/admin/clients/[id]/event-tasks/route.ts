import { NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'

export const dynamic = 'force-dynamic'

/**
 * Event task checklist — scoped to a client.
 *
 * GET   /api/admin/clients/[id]/event-tasks?event_id=<uuid>   list tasks for an event
 * PATCH /api/admin/clients/[id]/event-tasks?task_id=<uuid>    toggle is_completed
 *
 * Both handlers verify the event/task actually belongs to the client in the URL path,
 * so a caller cannot touch another tenant's checklist by guessing ids.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const clientId = (await params).id
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')

  if (!eventId) {
    return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  }

  // Ownership check: the event must belong to this client.
  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('client_id', clientId)
    .maybeSingle()

  if (!event) {
    return NextResponse.json({ error: 'Event tidak ditemukan untuk klien ini' }, { status: 404 })
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const clientId = (await params).id
  const { searchParams } = new URL(req.url)
  const taskId = searchParams.get('task_id')

  if (!taskId) {
    return NextResponse.json({ error: 'task_id required' }, { status: 400 })
  }

  const { is_completed } = await req.json()

  if (typeof is_completed !== 'boolean') {
    return NextResponse.json({ error: 'is_completed wajib boolean' }, { status: 400 })
  }

  // Ownership check: resolve the task's event, then confirm that event belongs to this client.
  const { data: task } = await supabase
    .from('event_tasks')
    .select('id, event_id')
    .eq('id', taskId)
    .maybeSingle()

  if (!task) {
    return NextResponse.json({ error: 'Task tidak ditemukan' }, { status: 404 })
  }

  const { data: ownerEvent } = await supabase
    .from('events')
    .select('id')
    .eq('id', task.event_id)
    .eq('client_id', clientId)
    .maybeSingle()

  if (!ownerEvent) {
    return NextResponse.json({ error: 'Task tidak ditemukan untuk klien ini' }, { status: 404 })
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

  return NextResponse.json({ task: data })
}