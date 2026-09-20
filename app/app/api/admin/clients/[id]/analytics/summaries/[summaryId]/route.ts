import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const UpdateSummarySchema = z.object({
  operator_notes: z.string().nullable().optional(),
  ai_insight: z.string().optional()
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; summaryId: string }> }
) {
  const { id: clientId, summaryId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = UpdateSummarySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const { operator_notes, ai_insight } = parsed.data

  const updates: Record<string, unknown> = {}
  if (operator_notes !== undefined) updates.operator_notes = operator_notes
  if (ai_insight !== undefined) updates.ai_insight = ai_insight

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('analytics_summaries')
    .update(updates)
    .eq('id', summaryId)
    .eq('client_id', clientId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    actorId: user.id,
    actorRole: 'admin',
    actorName: 'Admin',
    action: 'analytics.update_summary',
    entityType: 'analytics_summaries',
    entityId: summaryId,
    clientId,
    summary: 'Update catatan operator / insight',
  })

  return NextResponse.json({ summary: data })
}