import { NextResponse } from 'next/server'
// eslint-disable-next-line no-restricted-imports
import { createClient } from '@supabase/supabase-js'
import { getBridgeKey } from '@/lib/bridge/config'
import { listSocialAccounts, validatePost, createPost, toBridgePlatform } from '@/lib/bridge/woopsocial'
import { notifyAdminPublishStatus } from '@/lib/telegram/service'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { logger } from '@/lib/logger'

// Run dynamically, triggered by external CRON scheduler (Vercel Cron, pg_cron)
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // Simple auth for cron trigger
  const secret = process.env.CRON_SECRET || 'test_cron_secret'
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized CRON trigger' }, { status: 401 })
  }

  // Kill-switch: if auto-publish is disabled, do nothing (Phase 13 feature flag)
  const autoPublishEnabled = await isFeatureEnabled('auto_publish_enabled')
  if (!autoPublishEnabled) {
    logger.info('Auto-publish disabled by feature flag — skipping cron run')
    return NextResponse.json({ message: 'Auto-publish is disabled', processed: 0 })
  }

  // Use service role to bypass RLS for background job
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch posts due for publishing
  const { data: duePosts, error } = await supabase
    .from('scheduled_posts')
    .select('id, client_id, platform, title, content, scheduled_at, deliverable_id, publish_retry_count')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!duePosts || duePosts.length === 0) {
    return NextResponse.json({ message: 'No posts due for publishing', processed: 0 })
  }

  const apiKey = await getBridgeKey()
  if (!apiKey) {
    return NextResponse.json({ error: 'Bridge API Key missing' }, { status: 503 })
  }

  // Group by client to avoid fetching social accounts multiple times
  const clientAccountsCache: Record<string, { id: string; platform: string; [key: string]: unknown }[]> = {}

  const results = []

  for (const post of duePosts) {
    try {
      const bridgePlatform = toBridgePlatform(post.platform)
      if (!bridgePlatform) {
        throw new Error(`Platform ${post.platform} not supported by bridge`)
      }

      // Ensure we have this client's connected accounts
      if (!clientAccountsCache[post.client_id]) {
        // We fetch ALL accounts for the API key, then filter by platform
        // TODO: Map client_id -> projectId for true multi-tenant isolation
        const accountsRes = await listSocialAccounts(apiKey)
        clientAccountsCache[post.client_id] = accountsRes.ok ? accountsRes.data : []
      }

      const connected = clientAccountsCache[post.client_id].filter(
        a => a.platform === bridgePlatform
      )

      if (connected.length === 0) {
        throw new Error(`No connected accounts for platform: ${bridgePlatform}`)
      }

      const text = post.content || post.title || ''
      if (!text.trim()) {
        throw new Error('Post content is empty')
      }

      const postBody = {
        content: [{ text, media: [] }],
        schedule: { type: 'PUBLISH_NOW' },
        socialAccounts: connected.map(a => ({
          platform: a.platform,
          socialAccountId: a.id,
          postType: 'FEED'
        }))
      }

      const val = await validatePost(apiKey, postBody)
      if (!val.ok || !val.data.isValid) {
        throw new Error('Bridge validation failed')
      }

      const created = await createPost(apiKey, postBody)
      if (!created.ok) {
        throw new Error(`Bridge creation failed: ${created.error}`)
      }

      const createdData = created.data as { id?: string }
      // Update post status to published
      await supabase
        .from('scheduled_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          external_post_id: createdData?.id || null
        })
        .eq('id', post.id)

      // Audit Log
      await supabase.from('audit_log').insert({
        actor_role: 'system',
        actor_name: 'Cron Scheduler',
        action: 'scheduled_post.auto_publish',
        entity_type: 'scheduled_post',
        entity_id: post.id,
        client_id: post.client_id,
        summary: `Sistem otomatis mempublish "${post.title}" ke ${post.platform}`,
        metadata: { external_id: createdData?.id }
      })

      results.push({ id: post.id, success: true })
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      const retryCount = post.publish_retry_count || 0

      // Retry logic: max 3 kali percobaan sebelum gagal permanen
      if (retryCount < 3) {
        // Kembalikan status ke 'scheduled' dan increment retry count
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'scheduled',
            publish_retry_count: retryCount + 1,
            notes: errorMsg
          })
          .eq('id', post.id)
        results.push({ id: post.id, success: false, retry: retryCount + 1 })
      } else {
        // Maksimal retry tercapai, tandai sebagai failed permanen
        await supabase
          .from('scheduled_posts')
          .update({
            status: 'failed',
            publish_retry_count: retryCount,
            notes: errorMsg
          })
          .eq('id', post.id)
        results.push({ id: post.id, success: false, retry: retryCount, permanentFail: true })
      }

      // Kirim peringatan Telegram ke Admin secara asinkron
      const { data: admins } = await supabase
        .from('users')
        .select('telegram_chat_id')
        .eq('role', 'admin')
        .eq('telegram_notifications_enabled', true)
        .not('telegram_chat_id', 'is', null)

      if (admins && admins.length > 0) {
        for (const adm of admins) {
          if (adm.telegram_chat_id) {
            notifyAdminPublishStatus({
              adminChatId: adm.telegram_chat_id,
              title: post.title || 'Post Terjadwal',
              platform: post.platform,
              status: 'failed',
              error: errorMsg,
            }, {
              onBlocked: async (recipientType, recipientId) => {
                if (recipientId) {
                  await supabase
                    .from('users')
                    .update({ telegram_notifications_enabled: false })
                    .eq('id', recipientId)
                }
              }
            }).catch((notifyErr) => {
              console.error('[Telegram Alert Failed Post Error]:', notifyErr)
            })
          }
        }
      }
    }
  }

  return NextResponse.json({
    message: 'Batch processing complete',
    processed: results.length,
    results
  })
}