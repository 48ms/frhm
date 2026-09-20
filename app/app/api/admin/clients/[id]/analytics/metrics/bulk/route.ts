import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'
import { z } from 'zod'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

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
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return denyForbidden({ userId: user.id, role: profile?.role })

  const body = await request.json()
  const parsed = BulkImportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const rows = parsed.data
  let updated = 0
  let skipped = 0
  const errors: { row: number; reason: string }[] = []

  // Batch 1: validate all post_ids in ONE query
  const postIds = [...new Set(rows.map(r => r.post_id))]
  const { data: validPosts, error: postsQueryError } = await supabase
    .from('scheduled_posts')
    .select('id, platform')
    .in('id', postIds)
    .eq('client_id', clientId)

  if (postsQueryError) {
    return NextResponse.json({ error: postsQueryError.message }, { status: 500 })
  }

  const postMap = new Map((validPosts ?? []).map(p => [p.id, p.platform]))

  // Row-level validation against the single query result
  const validRows: typeof rows = []
  rows.forEach((row, i) => {
    const rowNum = i + 1
    const platform = postMap.get(row.post_id)
    if (!platform) {
      errors.push({ row: rowNum, reason: 'post_id not found or not owned by client' })
      skipped++
      return
    }
    if (platform !== row.platform) {
      errors.push({ row: rowNum, reason: `platform mismatch: expected ${platform}, got ${row.platform}` })
      skipped++
      return
    }
    validRows.push(row)
  })

  if (validRows.length > 0) {
    const upsertData = validRows.map(row => ({
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
    }))

    // Batch 2: single upsert for all valid rows
    const { error: upsertError } = await supabase
      .from('post_metrics')
      .upsert(upsertData, { onConflict: 'post_id' })

    if (upsertError) {
      // Fall back to per-row error reporting so the caller knows which rows failed
      for (let i = 0; i < validRows.length; i++) {
        const { error } = await supabase
          .from('post_metrics')
          .upsert({
            ...upsertData[i],
            recorded_at: new Date().toISOString()
          }, { onConflict: 'post_id' })
        if (error) {
          errors.push({ row: rows.indexOf(validRows[i]) + 1, reason: error.message })
          skipped++
        } else {
          updated++
        }
      }
    } else {
      updated = validRows.length
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