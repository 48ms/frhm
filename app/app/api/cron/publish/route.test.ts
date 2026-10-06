import { describe, it, expect, vi, beforeEach } from 'vitest'

const CRON_SECRET = 'test-cron-secret'

let duePosts: Array<Record<string, any>> = []
let activePlatforms = ['instagram', 'twitter']
let createShouldFail = false
let featureEnabled = true

// Capture updates
const postUpdates: Array<{ id: string; patch: Record<string, any> }> = []
const createdPosts: Array<{ body: any; profileKey: string }> = []
const auditInserts: Array<Record<string, any>> = []

vi.mock('@/lib/supabase/service', () => {
  return {
    createSupabaseServiceClient: () => ({
      from: (table: string) => {
        // Query builder
        const builder: any = {
          select: () => builder,
          lte: () => builder,
          not: () => builder,
          order: () => builder,
          eq: (col: string, val: any) => {
            if (col === 'status' && table === 'scheduled_posts') {
              builder._isDuePostsQuery = true
            }
            return builder
          },
          single: async () => ({ data: finalDataFor(table), error: null }),
          maybeSingle: async () => ({ data: finalDataFor(table), error: null }),
          insert: async (rows: any) => {
            if (table === 'audit_log') {
              (Array.isArray(rows) ? rows : [rows]).forEach(r => auditInserts.push(r))
            }
            return { error: null }
          },
          // Update returns a new sub-builder specifically to capture eq('id')
          update: (patch: Record<string, any>) => {
            const updateBuilder: any = {
              eq: (col: string, val: any) => {
                if (col === 'id') {
                  postUpdates.push({ id: val, patch })
                }
                return updateBuilder
              },
              then: (resolve: (v: any) => any) => {
                 return Promise.resolve({ data: null, error: null }).then(resolve)
              }
            }
            return updateBuilder
          },
          // Main builder's then() for reads
          then: (resolve: (v: any) => any) => {
            if (table === 'scheduled_posts' && builder._isDuePostsQuery) {
              return Promise.resolve({ data: duePosts, error: null }).then(resolve)
            }
            if (table === 'users') {
               return Promise.resolve({ data: [{ telegram_chat_id: 'chat-1' }], error: null }).then(resolve)
            }
            return Promise.resolve({ data: finalDataFor(table), error: null }).then(resolve)
          }
        }
        return builder
      }
    })
  }
})

vi.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: async (key: string) => key === 'auto_publish_enabled' ? featureEnabled : false,
}))

vi.mock('@/lib/bridge/config', () => ({
  getBridgeKey: async () => 'bridge-key',
}))

vi.mock('@/lib/bridge/client-project', () => ({
  getClientAyrshareProfileKey: async () => 'profile-key-123',
}))

vi.mock('@/lib/bridge/ayrshare', () => ({
  toBridgePlatform: (p: string) =>
    p === 'x' || p === 'twitter' ? 'twitter' : p === 'instagram' ? 'instagram' : null,
  getActivePlatforms: async () => ({ ok: true, data: activePlatforms }),
  validatePost: async () => ({ ok: true, data: { isValid: true } }),
  createPost: async (_apiKey: string, body: any, profileKey: string) => {
    createdPosts.push({ body, profileKey })
    if (createShouldFail) return { ok: false, error: 'Ayrshare rejected' }
    return { ok: true, data: { id: 'ext-post-1' } }
  },
}))

vi.mock('@/lib/telegram/service', () => ({
  notifyAdminPublishStatus: async () => ({ ok: true }),
}))

vi.mock('@/lib/audit/log', () => ({
  logAudit: async () => {},
}))

vi.mock('@/lib/logger', () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {} },
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('CRON_SECRET', CRON_SECRET)
  vi.stubEnv('AYRSHARE_API_KEY', 'ayrshare-key')
  duePosts = []
  postUpdates.length = 0
  auditInserts.length = 0
  createdPosts.length = 0
  activePlatforms = ['instagram', 'twitter']
  createShouldFail = false
  featureEnabled = true
})

function authedRequest() {
  return new Request('http://localhost/api/cron/publish', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${CRON_SECRET}`,
    },
  })
}

async function runCron(req: Request) {
  const { POST } = await import('./route')
  const res = await POST(req)
  return { status: res.status, body: await res.json() }
}

function finalDataFor(table: string) {
  if (table === 'clients') return { ayrshare_profile_key: 'profile-key-123' }
  return null
}

describe('POST /api/cron/publish', () => {
  it('rejects requests without the CRON secret header', async () => {
    const { status } = await runCron(
      new Request('http://localhost/api/cron/publish', { method: 'POST' })
    )
    expect(status).toBe(401)
  })

  it('rejects requests with a wrong Bearer token', async () => {
    const { status } = await runCron(
      new Request('http://localhost/api/cron/publish', {
        method: 'POST',
        headers: { authorization: 'Bearer wrong-secret' },
      })
    )
    expect(status).toBe(401)
  })

  it('skips the run when the auto_publish feature flag is disabled', async () => {
    featureEnabled = false
    const { status, body } = await runCron(authedRequest())
    expect(status).toBe(200)
    expect(body).toHaveProperty('processed', 0)
  })

  it('publishes a due post to Ayrshare and marks it published in the DB', async () => {
    duePosts = [
      {
        id: 'post-1',
        client_id: 'client-A',
        platform: 'instagram',
        title: 'Promo Akhir Tahun',
        content: 'Caption promo',
        scheduled_at: new Date(Date.now() - 60_000).toISOString(),
        media_url: null,
        publish_retry_count: 0,
      },
    ]

    const { status, body } = await runCron(authedRequest())

    expect(status).toBe(200)
    expect(body.processed).toBe(1)
    expect(createdPosts.length).toBe(1)
    expect(createdPosts[0].body.platforms).toEqual(['instagram'])
    expect(createdPosts[0].body.post).toBe('Caption promo')
    expect(createdPosts[0].profileKey).toBe('profile-key-123')

    const published = postUpdates.find((u) => u.id === 'post-1')
    expect(published).toBeDefined()
    expect(published!.patch.status).toBe('published')
    expect(published!.patch.external_post_id).toBe('ext-post-1')
  })

  it('resolves the "x" alias to the Ayrshare "twitter" platform before publishing', async () => {
    duePosts = [
      {
        id: 'post-x',
        client_id: 'client-A',
        platform: 'x',
        title: 'Thread X',
        content: 'isi thread',
        scheduled_at: new Date(Date.now() - 60_000).toISOString(),
        media_url: null,
        publish_retry_count: 0,
      },
    ]

    const { status, body } = await runCron(authedRequest())

    expect(status).toBe(200)
    expect(body.processed).toBe(1)
    expect(createdPosts[0].body.platforms).toEqual(['twitter'])

    const updated = postUpdates.find((u) => u.id === 'post-x')
    expect(updated!.patch.status).toBe('published')
  })

  it('retries on a transient Ayrshare error and bumps publish_retry_count', async () => {
    createShouldFail = true
    duePosts = [
      {
        id: 'post-retry',
        client_id: 'client-A',
        platform: 'instagram',
        title: 'Retry me',
        content: 'c',
        scheduled_at: new Date(Date.now() - 60_000).toISOString(),
        media_url: null,
        publish_retry_count: 0,
      },
    ]

    const { status, body } = await runCron(authedRequest())

    expect(status).toBe(200)
    const result = body.results.find((r: any) => r.id === 'post-retry')
    expect(result.success).toBe(false)
    expect(result.retry).toBe(1)

    const update = postUpdates.find((u) => u.id === 'post-retry')
    expect(update!.patch.status).toBe('scheduled')
    expect(update!.patch.publish_retry_count).toBe(1)
  })

  it('marks a post permanently failed after exhausting 3 retries', async () => {
    createShouldFail = true
    duePosts = [
      {
        id: 'post-dead',
        client_id: 'client-A',
        platform: 'instagram',
        title: 'Give up',
        content: 'c',
        scheduled_at: new Date(Date.now() - 60_000).toISOString(),
        media_url: null,
        publish_retry_count: 3,
      },
    ]

    const { status, body } = await runCron(authedRequest())

    expect(status).toBe(200)
    const result = body.results.find((r: any) => r.id === 'post-dead')
    expect(result.permanentFail).toBe(true)

    const update = postUpdates.find((u) => u.id === 'post-dead')
    expect(update!.patch.status).toBe('failed')
  })

  it('returns nothing when no posts are due', async () => {
    duePosts = []
    const { status, body } = await runCron(authedRequest())
    expect(status).toBe(200)
    expect(body).toHaveProperty('processed', 0)
    expect(createdPosts.length).toBe(0)
  })

  it('refuses a post that is missing both content and media', async () => {
    duePosts = [
      {
        id: 'post-empty',
        client_id: 'client-A',
        platform: 'instagram',
        title: '',
        content: '',
        scheduled_at: new Date(Date.now() - 60_000).toISOString(),
        media_url: null,
        publish_retry_count: 0,
      },
    ]

    const { status, body } = await runCron(authedRequest())

    expect(status).toBe(200)
    const result = body.results.find((r: any) => r.id === 'post-empty')
    expect(result.success).toBe(false)
  })

  it('still marks a post published even if the audit log write throws', async () => {
    // The audit helper must never fail the action it describes. If the audit
    // insert throws inside the try block, a successful publish would be
    // flipped back to retry/failed — a real regression this test guards.
    vi.doMock('@/lib/audit/log', () => ({
      logAudit: async () => {
        throw new Error('audit table down')
      },
    }))
    vi.resetModules()

    duePosts = [
      {
        id: 'post-audit',
        client_id: 'client-A',
        platform: 'instagram',
        title: 'Audit resilience',
        content: 'c',
        scheduled_at: new Date(Date.now() - 60_000).toISOString(),
        media_url: null,
        publish_retry_count: 0,
      },
    ]

    const { status, body } = await runCron(authedRequest())

    expect(status).toBe(200)
    const result = body.results.find((r: any) => r.id === 'post-audit')
    expect(result.success).toBe(true)

    const update = postUpdates.find((u) => u.id === 'post-audit')
    expect(update!.patch.status).toBe('published')
  })
})
