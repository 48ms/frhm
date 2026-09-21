import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyZeroMetricsEscalation } from '@/lib/telegram/service'
import { reportError } from '@/lib/error-reporter'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return denyUnauthorized()
  }

  const supabase = await createClient()

  // Find posts published 24-25 hours ago with no metrics
  const now = new Date()
  const windowStart = new Date(now.getTime() - 25 * 60 * 60 * 1000) // 25 hours ago
  const windowEnd = new Date(now.getTime() - 23 * 60 * 60 * 1000)   // 23 hours ago

  const { data: posts, error } = await supabase
    .from('scheduled_posts')
    .select(`
      id, title, platform, published_at, campaign_tag, client_id,
      post_metrics ( id )
    `)
    .eq('status', 'published')
    .gte('published_at', windowStart.toISOString())
    .lte('published_at', windowEnd.toISOString())
    .is('post_metrics', null) // No metrics linked (or empty array)

  if (error) {
    console.error('[Cron Zero Metrics] Query error:', error)
    reportError({
      message: error.message || 'Query failed',
      name: 'DatabaseError',
      url: '/cron/check-zero-metrics',
      component: 'cron/check-zero-metrics',
      context: { query: 'scheduled_posts zero-metrics check' },
    })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filter posts where post_metrics is null or empty array
  const zeroMetricPosts = (posts || []).filter(p => !p.post_metrics || (Array.isArray(p.post_metrics) && p.post_metrics.length === 0))

  if (zeroMetricPosts.length === 0) {
    return NextResponse.json({ message: 'No zero-metric posts found', checked: posts?.length || 0 })
  }

  // Fetch client details for notifications
  const clientIds = [...new Set(zeroMetricPosts.map(p => p.client_id))]
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, telegram_chat_id, telegram_notifications_enabled')
    .in('id', clientIds)

  const clientMap = new Map((clients || []).map(c => [c.id, c]))

  let notified = 0
  let failed = 0

  for (const post of zeroMetricPosts) {
    const client = clientMap.get(post.client_id)
    if (!client || !client.telegram_chat_id || !client.telegram_notifications_enabled) {
      continue
    }

    const result = await notifyZeroMetricsEscalation({
      adminChatId: client.telegram_chat_id,
      clientName: client.name,
      title: post.title,
      platform: post.platform,
      publishedAt: post.published_at!,
      campaignTag: post.campaign_tag || undefined,
    })

    if (result.success) {
      notified++
    } else {
      failed++
      console.error(`[Cron Zero Metrics] Failed to notify for post ${post.id}:`, result.error)
    }
  }

  return NextResponse.json({
    message: 'Zero-metrics check complete',
    window: { start: windowStart.toISOString(), end: windowEnd.toISOString() },
    totalPostsChecked: posts?.length || 0,
    zeroMetricPosts: zeroMetricPosts.length,
    notified,
    failed,
  })
}