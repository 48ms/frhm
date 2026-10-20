import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { env } from '@/lib/env'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { logger } from '@/lib/logger'
import { logAudit } from '@/lib/audit/log'

export const dynamic = 'force-dynamic'

export const AYRSHARE_TIMESTAMP_TOLERANCE_SECONDS = 5 * 60

type AyrshareVerificationInput = {
  secret: string | undefined
  timestamp: string | null
  signature: string | null
  signatureV2: string | null
  rawBody: string
  now?: number
}

function safeEqualHex(provided: string, expected: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(provided)) return false
  const providedBuf = Buffer.from(provided.toLowerCase(), 'utf8')
  const expectedBuf = Buffer.from(expected, 'utf8')
  return (
    providedBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(providedBuf, expectedBuf)
  )
}

function getV2Signatures(value: string | null): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.startsWith('v1='))
    .map((part) => part.slice(3))
}

export function verifyAyrshareWebhook({
  secret,
  timestamp,
  signature,
  signatureV2,
  rawBody,
  now = Date.now(),
}: AyrshareVerificationInput): { ok: boolean; reason?: string } {
  if (!secret) {
    if (env.server.NODE_ENV === 'development') {
      return { ok: true }
    }
    return { ok: false, reason: 'Webhook secret not configured' }
  }

  if (!timestamp || !/^\d+$/.test(timestamp)) {
    return { ok: false, reason: 'Missing or invalid timestamp' }
  }

  const timestampSeconds = Number(timestamp)
  const nowSeconds = Math.floor(now / 1000)
  if (
    !Number.isSafeInteger(timestampSeconds) ||
    Math.abs(nowSeconds - timestampSeconds) > AYRSHARE_TIMESTAMP_TOLERANCE_SECONDS
  ) {
    return { ok: false, reason: 'Timestamp outside tolerance window' }
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const candidates = [...getV2Signatures(signatureV2), ...(signature ? [signature] : [])]
  if (candidates.length === 0) {
    return { ok: false, reason: 'Missing signature' }
  }

  if (candidates.some((candidate) => safeEqualHex(candidate, expected))) {
    return { ok: true }
  }

  return { ok: false, reason: 'Invalid signature' }
}

export async function POST(request: Request) {
  let rawBody = ''
  try {
    rawBody = await request.text()
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 })
  }

  const timestamp = request.headers.get('x-authorization-timestamp')

  const authResult = verifyAyrshareWebhook({
    secret: env.server.AYRSHARE_WEBHOOK_SECRET,
    timestamp,
    signature: request.headers.get('x-authorization-content-sha256'),
    signatureV2: request.headers.get('x-authorization-content-sha256-v2'),
    rawBody,
  })

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

  const hasTimestampMismatch =
    Boolean(env.server.AYRSHARE_WEBHOOK_SECRET) &&
    events.some(
      (event) =>
        event &&
        typeof event === 'object' &&
        event.timeStamp !== undefined &&
        String(event.timeStamp) !== timestamp
    )
  if (hasTimestampMismatch) {
    logger.warn('webhooks.ayrshare.unauthorized', {
      route: 'api/webhooks/ayrshare',
      reason: 'Body timestamp mismatch',
    })
    return NextResponse.json({ error: 'Unauthorized webhook trigger' }, { status: 401 })
  }

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
