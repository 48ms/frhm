import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'
import { z } from 'zod'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

// Validation schemas
const SingleFieldUpdateSchema = z.object({
  post_id: z.string().uuid(),
  field: z.enum(['views', 'reach', 'likes', 'comments', 'shares', 'saves', 'clicks', 'wa_inquiries', 'dm_inquiries']),
  value: z.number().int().min(0)
})

// GET all published posts and their metrics for a client
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  const supabase = await createClient()

  // Verify auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  // Get all published posts
  const { data: posts, error: postsError } = await supabase
    .from('scheduled_posts')
    .select(`
      id, title, platform, scheduled_at, campaign_tag, content_type, creative_format,
      post_metrics (
        views, reach, likes, comments, shares, saves, clicks, wa_inquiries, dm_inquiries, theme_tag, recorded_at, comment_details, sentiment_summary
      )
    `)
    .eq('client_id', clientId)
    .eq('status', 'published')
    .order('scheduled_at', { ascending: false })

  if (postsError) return NextResponse.json({ error: postsError.message }, { status: 500 })

  return NextResponse.json({ posts: posts || [] })
}

// PATCH - Single field update for inline editing
export async function PATCH(
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
  const parsed = SingleFieldUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 })
  }

  const { post_id, field, value } = parsed.data

  // Verify post belongs to client
  const { data: post, error: postError } = await supabase
    .from('scheduled_posts')
    .select('id, platform')
    .eq('id', post_id)
    .eq('client_id', clientId)
    .single()

  if (postError || !post) {
    return NextResponse.json({ error: 'Post not found for this client' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('post_metrics')
    .upsert({
      post_id,
      client_id: clientId,
      platform: post.platform,
      [field]: value,
      recorded_at: new Date().toISOString()
    }, { onConflict: 'post_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    actorId: user.id,
    actorRole: 'admin',
    actorName: 'Admin',
    action: 'analytics.update',
    entityType: 'post_metrics',
    entityId: post_id,
    clientId,
    summary: `Update ${field} for post ${post.platform}`,
  })

  return NextResponse.json({ metric: data })
}

// POST to upsert metrics for a post (full row)
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
  const { post_id, platform, views, reach, likes, comments, shares, saves, clicks } = body

  if (!post_id || !platform) {
    return NextResponse.json({ error: 'post_id and platform required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('post_metrics')
    .upsert({
      post_id,
      client_id: clientId,
      platform,
      views: views || 0,
      reach: reach || 0,
      likes: likes || 0,
      comments: comments || 0,
      shares: shares || 0,
      saves: saves || 0,
      clicks: clicks || 0,
      recorded_at: new Date().toISOString()
    }, { onConflict: 'post_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    actorId: user.id,
    actorRole: 'admin',
    actorName: 'Admin',
    action: 'analytics.update',
    entityType: 'post_metrics',
    entityId: post_id,
    clientId,
    summary: `Update metrik post ${platform}`,
  })

  return NextResponse.json({ metric: data })
}
