import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { getActivePlatforms, validatePost, createPost, toBridgePlatform } from '@/lib/bridge/ayrshare'
import { getClientAyrshareProfileKey } from '@/lib/bridge/client-project'
import { notifyAdminPublishStatus } from '@/lib/telegram/service'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { logger } from '@/lib/logger'
import { logAudit } from '@/lib/audit/log'
import { verifyCronSecret } from '@/lib/cron/auth'

// Run dynamically, triggered by external CRON scheduler (Vercel Cron, pg_cron)
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // Fail-closed cron auth
  const cronAuth = verifyCronSecret(process.env.CRON_SECRET, request.headers.get('authorization'))
  if (!cronAuth.ok) {
    logger.warn('cron.publish.rejected', { route: 'api/cron/publish', reason: cronAuth.reason })
    return NextResponse.json({ error: 'Unauthorized CRON trigger' }, { status: 401 })
  }

  void logAudit({
    action: 'cron.publish',
    summary: 'Execution triggered via cron',
    request,
  })

  // Kill-switch
  const autoPublishEnabled = await isFeatureEnabled('auto_publish_enabled')
  if (!autoPublishEnabled) {
    logger.info('Auto-publish disabled by feature flag — skipping cron run')
    return NextResponse.json({ message: 'Auto-publish is disabled', processed: 0 })
  }

  const supabase = createSupabaseServiceClient()

  // Fetch posts due for publishing (also fetch media_url if joined, but wait, schema doesn't have media_url inside scheduled_posts yet, or does it? Wait, migration 051 added media_url_to_scheduled_posts).
  // I will just select media_url as well.
  const { data: duePosts, error } = await supabase
    .from('scheduled_posts')
    .select('id, client_id, platform, title, content, scheduled_at, deliverable_id, publish_retry_count, media_url')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!duePosts || duePosts.length === 0) {
    return NextResponse.json({ message: 'No posts due for publishing', processed: 0 })
  }

  // Use AYRSHARE API key
  const apiKey = process.env.AYRSHARE_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Ayrshare API Key missing' }, { status: 503 })
  }

  const clientAccountsCache: Record<string, string[]> = {}
  const results = []

  for (const post of duePosts) {
    try {
      const bridgePlatform = toBridgePlatform(post.platform)
      if (!bridgePlatform) {
        throw new Error(`Platform ${post.platform} not supported by Ayrshare`)
      }

      // Fetch client profile key
      const profileKey = await getClientAyrshareProfileKey(post.client_id)
      if (!profileKey) {
        throw new Error(`Client has no Ayrshare profileKey configured`)
      }

      if (!clientAccountsCache[post.client_id]) {
        const accountsRes = await getActivePlatforms(apiKey, profileKey)
        clientAccountsCache[post.client_id] = accountsRes.ok ? accountsRes.data : []
      }

      const connected = clientAccountsCache[post.client_id].includes(bridgePlatform)
      if (!connected) {
        throw new Error(`Account not connected in Ayrshare for platform: ${bridgePlatform}`)
      }

      const text = post.content || post.title || ''
      if (!text.trim() && !post.media_url) {
        throw new Error('Post content and media are both empty')
      }

      const postBody = {
        post: text,
        platforms: [bridgePlatform],
        mediaUrls: post.media_url ? [post.media_url] : undefined
      }

      const val = await validatePost(apiKey, postBody, profileKey)
      if (!val.ok || !val.data.isValid) {
        throw new Error('Bridge validation failed')
      }

      const created = await createPost(apiKey, postBody, profileKey)
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

      // Audit Log. Use the shared helper: it never throws, so a failed audit
      // write cannot mark an already-published post as failed. Previously this
      // was a direct insert inside the try block, where any audit error would
      // bubble to the catch and flip a successful publish back to retry/failed.
      void logAudit({
        actorRole: 'system',
        actorName: 'Cron Scheduler',
        action: 'scheduled_post.auto_publish',
        entityType: 'scheduled_post',
        entityId: post.id,
        clientId: post.client_id,
        summary: `Sistem otomatis mempublish "${post.title}" ke ${post.platform}`,
        metadata: { external_id: createdData?.id },
        request,
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

        // Forensic: a post that exhausts retries is a client-visible failure.
        void logAudit({
          action: 'scheduled_post.publish_failed_permanent',
          actorRole: 'system',
          actorName: 'Cron Scheduler',
          entityType: 'scheduled_post',
          entityId: post.id,
          clientId: post.client_id,
          summary: `Publish gagal permanen setelah ${retryCount} percobaan: ${errorMsg}`,
          metadata: { platform: post.platform, retry_count: retryCount },
          request,
        })

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
              logger.error('Telegram alert for failed post errored', { error: notifyErr })
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