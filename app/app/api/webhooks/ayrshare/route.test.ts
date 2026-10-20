import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST, verifyAyrshareWebhook } from './route'
import crypto from 'crypto'

const auditCalls: Array<Record<string, unknown>> = []
vi.mock('@/lib/audit/log', () => ({
  logAudit: vi.fn(async (input: Record<string, unknown>) => {
    auditCalls.push(input)
  }),
}))

const updatedScheduledPosts: Array<Record<string, unknown>> = []
const upsertedMetrics: Array<Record<string, unknown>> = []

const mockPost = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  client_id: 'client-1111',
  platform: 'instagram',
  title: 'Kopi Susu Gula Aren Spesial',
  status: 'scheduled',
  notes: null,
}

function mockSupabaseService() {
  return {
    from: (table: string) => ({
      select: () => ({
        or: () => ({
          maybeSingle: async () => ({
            data: mockPost,
            error: null,
          }),
        }),
      }),
      update: (payload: Record<string, unknown>) => ({
        eq: (col: string, val: unknown) => {
          updatedScheduledPosts.push({ table, payload, col, val })
          return { error: null }
        },
      }),
      upsert: (payload: Record<string, unknown>) => {
        upsertedMetrics.push({ table, payload })
        return { error: null }
      },
    }),
  }
}

vi.mock('@/lib/supabase/service', () => ({
  createSupabaseServiceClient: () => mockSupabaseService(),
}))

vi.mock('@/lib/env', () => ({
  env: {
    server: {
      NODE_ENV: 'test',
      AYRSHARE_API_KEY: 'test-api-key',
      AYRSHARE_WEBHOOK_SECRET: 'test-webhook-secret',
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  auditCalls.length = 0
  updatedScheduledPosts.length = 0
  upsertedMetrics.length = 0
})

const VERIFY_SECRET = process.env.TEST_AYRSHARE_SECRET || 'super-secret'
const VERIFY_NOW = 1_760_000_000_000
const VERIFY_TIMESTAMP = String(VERIFY_NOW / 1000)

function hmac(body: string, secret = VERIFY_SECRET) {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}

function routeHeaders(body: string, timestamp = String(Math.floor(Date.now() / 1000))) {
  const signature = hmac(body, 'test-webhook-secret')
  return {
    'Content-Type': 'application/json',
    'x-authorization-timestamp': timestamp,
    'x-authorization-content-sha256': signature,
    'x-authorization-content-sha256-v2': `v1=${signature}`,
  }
}

describe('Ayrshare Webhook - verifyAyrshareWebhook', () => {
  const rawBody = JSON.stringify({ action: 'post', status: 'success', timeStamp: Number(VERIFY_TIMESTAMP) })
  const signature = hmac(rawBody)

  function verify(overrides: Partial<Parameters<typeof verifyAyrshareWebhook>[0]> = {}) {
    return verifyAyrshareWebhook({
      secret: VERIFY_SECRET,
      timestamp: VERIFY_TIMESTAMP,
      signature,
      signatureV2: null,
      rawBody,
      now: VERIFY_NOW,
      ...overrides,
    })
  }

  it('validates the official HMAC-SHA256 signature', () => {
    expect(verify().ok).toBe(true)
  })

  it('validates a V2 signature during secret rotation', () => {
    const result = verify({
      signature: null,
      signatureV2: `v1=${'0'.repeat(64)},v1=${signature}`,
    })
    expect(result.ok).toBe(true)
  })

  it('rejects a tampered signature', () => {
    expect(verify({ signature: '0'.repeat(64) }).ok).toBe(false)
  })

  it('rejects malformed signatures', () => {
    expect(verify({ signature: 'not-a-hash' }).ok).toBe(false)
  })

  it('rejects a stale timestamp outside the tolerance window', () => {
    const result = verify({ timestamp: String(Number(VERIFY_TIMESTAMP) - 301) })
    expect(result.ok).toBe(false)
    expect(result.reason).toBe('Timestamp outside tolerance window')
  })

  it('rejects a future timestamp outside the tolerance window', () => {
    const result = verify({ timestamp: String(Number(VERIFY_TIMESTAMP) + 301) })
    expect(result.ok).toBe(false)
  })

  it('rejects missing timestamps and signatures', () => {
    expect(verify({ timestamp: null }).ok).toBe(false)
    expect(verify({ signature: null, signatureV2: null }).ok).toBe(false)
  })

  it('rejects all deliveries when no secret is configured outside development', () => {
    expect(verify({ secret: undefined }).ok).toBe(false)
  })
})

describe('Ayrshare Webhook Route - POST', () => {
  it('rejects unauthorized requests with 401 when the signature is invalid', async () => {
    const body = JSON.stringify({ action: 'post', id: 'ayr-123' })
    const timestamp = String(Math.floor(Date.now() / 1000))
    const req = new Request('http://localhost:3000/api/webhooks/ayrshare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-authorization-timestamp': timestamp,
        'x-authorization-content-sha256': '0'.repeat(64),
      },
      body,
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('rejects replayed requests with a stale timestamp', async () => {
    const body = JSON.stringify({ action: 'post', id: 'ayr-123' })
    const req = new Request('http://localhost:3000/api/webhooks/ayrshare', {
      method: 'POST',
      headers: routeHeaders(body, String(Math.floor(Date.now() / 1000) - 301)),
      body,
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('rejects a valid signature when the body timestamp does not match', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000))
    const body = JSON.stringify({ action: 'post', id: 'ayr-123', timeStamp: Number(timestamp) - 60 })
    const req = new Request('http://localhost:3000/api/webhooks/ayrshare', {
      method: 'POST',
      headers: routeHeaders(body, timestamp),
      body,
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('confirms published post with live URL when receiving success event', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000))
    const body = JSON.stringify({
      action: 'post',
      status: 'success',
      id: 'ayr-post-123',
      timeStamp: Number(timestamp),
      postIds: {
        instagram: {
          id: 'ig-999',
          postUrl: 'https://instagram.com/p/taraju-promo',
        },
      },
    })

    const req = new Request('http://localhost:3000/api/webhooks/ayrshare', {
      method: 'POST',
      headers: routeHeaders(body, timestamp),
      body,
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.processed).toBe(1)
    expect(updatedScheduledPosts.length).toBe(1)
    expect(updatedScheduledPosts[0].payload).toMatchObject({
      status: 'published',
      external_post_id: 'ayr-post-123',
      notes: '[Live URL]: https://instagram.com/p/taraju-promo',
    })
    expect(auditCalls.some((c) => c.action === 'scheduled_post.webhook_published')).toBe(true)
  })

  it('records failed status and error notes when receiving error event', async () => {
    const body = JSON.stringify({
      action: 'post',
      status: 'error',
      id: 'ayr-post-456',
      errors: [{ message: 'Instagram token expired, please reconnect' }],
    })

    const req = new Request('http://localhost:3000/api/webhooks/ayrshare', {
      method: 'POST',
      headers: routeHeaders(body),
      body,
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    expect(updatedScheduledPosts.length).toBe(1)
    expect(updatedScheduledPosts[0].payload).toMatchObject({
      status: 'failed',
      notes: '[Webhook Error]: Instagram token expired, please reconnect',
    })
    expect(auditCalls.some((c) => c.action === 'scheduled_post.webhook_failed')).toBe(true)
  })

  it('upserts metrics into post_metrics when receiving analytics event', async () => {
    const body = JSON.stringify({
      action: 'analytics',
      id: 'ayr-post-789',
      analytics: {
        impressions: 4500,
        reach: 3200,
        likes: 210,
        comments: 34,
        shares: 68,
        saves: 112,
      },
    })

    const req = new Request('http://localhost:3000/api/webhooks/ayrshare', {
      method: 'POST',
      headers: routeHeaders(body),
      body,
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    expect(upsertedMetrics.length).toBe(1)
    expect(upsertedMetrics[0].payload).toMatchObject({
      post_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      client_id: 'client-1111',
      reach: 3200,
      likes: 210,
      comments: 34,
      shares: 68,
      saves: 112,
    })
    expect(auditCalls.some((c) => c.action === 'analytics.webhook_synced')).toBe(true)
  })
})
