import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { env } from '@/lib/env'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { logger } from '@/lib/logger'
import { logAudit } from '@/lib/audit/log'

export const dynamic = 'force-dynamic'

/**
 * Verify Ayrshare Webhook authenticity.
 * Checks HMAC-SHA256 signature or secret token in headers.
 */
export function verifyAyrshareWebhook(
  secret: string | undefined,
  apiKey: string | undefined,
  signature: string | null,
  headerSecret: string | null,
  rawBody: string
): { ok: boolean; reason?: string } {
  // 1. If explicit webhook secret is configured
  if (secret) {
    if (headerSecret && headerSecret === secret) {
      return { ok: true }
    }

    if (signature) {
      try {
        const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
        const sigBuf = Buffer.from(signature)
        const expBuf = Buffer.from(expected)
        if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
          return { ok: true }
        }
      } catch {}
    }
    return { ok: false, reason: 'Invalid signature or secret' }
  }

  // 2. Fall back to AYRSHARE_API_KEY match if header passed
  if (apiKey && headerSecret && headerSecret === apiKey) {
    return { ok: true }
  }

  // 3. In development/test environment without secret, allow safe bypass
  if (env.server.NODE_ENV !== 'production') {
    return { ok: true }
  }

  return { ok: false, reason: 'Webhook secret not configured in production' }
}

export async function POST(request: Request) {
  let rawBody = ''
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 })
  }

  const signature =
    request.headers.get('x-ayrshare-hmac-sha256') ||
    request.headers.get('x-hub-signature-256') ||
    null

  const headerSecret =
    request.headers.get('x-webhook-secret') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    null

  const authResult = verifyAyrshareWebhook(
    env.server.AYRSHARE_WEBHOOK_SECRET,
    env.server.AYRSHARE_API_KEY,
    signature,
    headerSecret,
    rawBody
  )

  if (!authResult.ok) {
    logger.warn('webhooks.ayrshare.unauthorized', {
      route: 'api/webhooks/ayrshare',
      reason: authResult.reason,
    })
    return NextResponse.json({ error: 'Unauthorized webhook trigger' }, { status: 401 })
  }

  let parsed: any = null
  try {
    parsed = rawBody ? JSON.parse(rawBody) : {}
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const events: any[] = Array.isArray(parsed) ? parsed : [parsed]
  const supabase = createSupabaseServiceClient()
  let processedCount = 0

  for (const event of events) {
    try {
      const ayrshareId = event.id || event.postId || event.post_id || null
      if (!ayrshareId) {
        continue
      }

      // 1. Locate corresponding scheduled post by external_post_id or id
      const { data: post } = await supabase
        .from('scheduled_posts')
        .select('id, client_id, platform, title, status, notes')
        .or(`external_post_id.eq.${ayrshareId},id.eq.${ayrshareId}`)
        .maybeSingle()

      if (!post) {
        logger.info('webhooks.ayrshare.post_not_found', { ayrshareId })
        continue
      }

      const isError =
        event.status === 'error' ||
        (Array.isArray(event.errors) && event.errors.length > 0)

      const isAnalytics =
        event.action === 'analytics' ||
        Boolean(event.analytics)

      if (isError) {
        // Handle publishing failure reported by social bridge
        const errorText = Array.isArray(event.errors)
          ? event.errors.map((e: any) => e.message || String(e)).join('; ')
          : String(event.error || 'Ayrshare publish error reported via webhook')

        await supabase
          .from('scheduled_posts')
          .update({
            status: 'failed',
            notes: `[Webhook Error]: ${errorText}`,
          })
          .eq('id', post.id)

        void logAudit({
          actorRole: 'system',
          actorName: 'Ayrshare Webhook',
          action: 'scheduled_post.webhook_failed',
          entityType: 'scheduled_post',
          entityId: post.id,
          clientId: post.client_id,
          summary: `Publishing gagal via webhook untuk "${post.title}": ${errorText}`,
          metadata: { ayrshare_id: ayrshareId, platform: post.platform },
          request,
        }).catch(() => {})

        processedCount++
      } else if (isAnalytics) {
        // Handle incoming analytics metrics
        const analytics = event.analytics || {}
        const views = Number(analytics.impressions || analytics.views || 0)
        const reach = Number(analytics.reach || views)
        const likes = Number(analytics.likes || 0)
        const comments = Number(analytics.comments || 0)
        const shares = Number(analytics.shares || analytics.retweets || 0)
        const saves = Number(analytics.saves || 0)
        const clicks = Number(analytics.clicks || 0)

        await supabase
          .from('post_metrics')
          .upsert(
            {
              post_id: post.id,
              client_id: post.client_id,
              platform: post.platform,
              views,
              reach,
              likes,
              comments,
              shares,
              saves,
              clicks,
              recorded_at: new Date().toISOString(),
            },
            { onConflict: 'post_id' }
          )

        void logAudit({
          actorRole: 'system',
          actorName: 'Ayrshare Webhook',
          action: 'analytics.webhook_synced',
          entityType: 'post_metrics',
          entityId: post.id,
          clientId: post.client_id,
          summary: `Sinkronisasi metriks webhook untuk "${post.title}": ${reach} reach, ${saves} saves, ${shares} shares`,
          metadata: { ayrshare_id: ayrshareId, platform: post.platform },
          request,
        }).catch(() => {})

        processedCount++
      } else {
        // Successful publication confirmed
        const postIds = event.postIds || {}
        const platformKey = post.platform.toLowerCase()
        const platformData = postIds[platformKey] || Object.values(postIds)[0]
        const liveUrl = platformData?.postUrl || platformData?.url || null

        const updatePayload: Record<string, unknown> = {
          status: 'published',
          published_at: new Date().toISOString(),
          external_post_id: ayrshareId,
        }

        if (liveUrl) {
          updatePayload.notes = `[Live URL]: ${liveUrl}`
        }

        await supabase
          .from('scheduled_posts')
          .update(updatePayload)
          .eq('id', post.id)

        void logAudit({
          actorRole: 'system',
          actorName: 'Ayrshare Webhook',
          action: 'scheduled_post.webhook_published',
          entityType: 'scheduled_post',
          entityId: post.id,
          clientId: post.client_id,
          summary: `Postingan "${post.title}" terkonfirmasi terbit di ${post.platform} via webhook`,
          metadata: { ayrshare_id: ayrshareId, platform: post.platform, live_url: liveUrl },
          request,
        }).catch(() => {})

        processedCount++
      }
    } catch (err) {
      logger.error('webhooks.ayrshare.event_failed', { error: err, event })
    }
  }

  return NextResponse.json({
    received: true,
    processed: processedCount,
  })
}
