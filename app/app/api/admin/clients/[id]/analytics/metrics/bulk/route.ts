import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const BulkUpsertSchema = z.object({
  post_id: z.string().uuid(),
  platform: z.string(),
  views: z.number().int().min(0).optional(),
  reach: z.number().int().min(0).optional(),
  likes: z.number().int().min(0).optional(),
  comments: z.number().int().min(0).optional(),
  shares: z.number().int().min(0).optional(),
  saves: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  wa_inquiries: z.number().int().min(0).optional(),
  dm_inquiries: z.number().int().min(0).optional()
})

const BulkImportSchema = z.array(BulkUpsertSchema).min(1).max(500)

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const parsed = BulkImportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const rows = parsed.data
  let updated = 0
  let skipped = 0
  const errors: { row: number; reason: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1

    // Verify post exists and belongs to client
    const { data: post, error: postError } = await supabase
      .from('scheduled_posts')
      .select('id, platform')
      .eq('id', row.post_id)
      .eq('client_id', clientId)
      .single()

    if (postError || !post) {
      errors.push({ row: rowNum, reason: `post_id not found or not owned by client` })
      skipped++
      continue
    }

    // Validate platform matches
    if (post.platform !== row.platform) {
      errors.push({ row: rowNum, reason: `platform mismatch: expected ${post.platform}, got ${row.platform}` })
      skipped++
      continue
    }

    const upsertData = {
      post_id: row.post_id,
      client_id: clientId,
      platform: row.platform,
      views: row.views ?? 0,
      reach: row.reach ?? 0,
      likes: row.likes ?? 0,
      comments: row.comments ?? 0,
      shares: row.shares ?? 0,
      saves: row.saves ?? 0,
      clicks: row.clicks ?? 0,
      wa_inquiries: row.wa_inquiries ?? 0,
      dm_inquiries: row.dm_inquiries ?? 0,
      recorded_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('post_metrics')
      .upsert(upsertData, { onConflict: 'post_id' })

    if (error) {
      errors.push({ row: rowNum, reason: error.message })
      skipped++
    } else {
      updated++
    }
  }

  await logAudit({
    actorId: user.id,
    actorRole: 'admin',
    actorName: 'Admin',
    action: 'analytics.bulk_import',
    entityType: 'post_metrics',
    clientId,
    summary: `Bulk import: ${updated} updated, ${skipped} skipped`,
  })

  return NextResponse.json({ updated, skipped, errors })
}