import { NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'

export const dynamic = 'force-dynamic'

/**
 * Update a content_item by id (admin-only).
 *
 * PATCH /api/admin/content-items
 *   body: { id: string, status?: string, publish_date?: string }
 */
export async function PATCH(req: Request) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const { id, status, publish_date } = await req.json()

  if (!id) {
    return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (status !== undefined) updates.status = status
  if (publish_date !== undefined) updates.publish_date = new Date(publish_date).toISOString()

  const { error } = await supabase.from('content_items').update(updates).eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
