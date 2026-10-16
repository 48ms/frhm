import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getClients,
  createNewClient,
  getDashboardProfile,
  getDashboardProfileWithMetrics,
} from './service'

/**
 * Per-table mock Supabase: `from(table)` returns a chainable builder that is
 * also a thenable. Terminal `.single()` OR a bare `await` each shift the next
 * queued result for that table — so we can script multi-query flows exactly.
 */
const queues = new Map<string, unknown[]>()
const push = (table: string, ...results: unknown[]) => {
  if (!queues.has(table)) queues.set(table, [])
  queues.get(table)!.push(...results)
}
const next = (table: string) =>
  Promise.resolve(queues.get(table)?.shift() ?? { data: null, error: null })

const makeBuilder = (table: string) => {
  const b: Record<string, unknown> = {}
  for (const m of ['select', 'eq', 'order', 'not', 'insert', 'update', 'upsert', 'delete']) {
    b[m] = vi.fn(() => b)
  }
  b.single = vi.fn(() => next(table))
  b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => next(table).then(res, rej)
  return b
}

const mockSupabase = { from: vi.fn((table: string) => makeBuilder(table)) }

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn(() => mockSupabase) }))
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }))
vi.mock('@/lib/audit/log', () => ({ logAudit: vi.fn() }))
vi.mock('@/lib/auth/guard', () => ({
  assertAdmin: vi.fn().mockResolvedValue({ userId: 'admin-1' }),
}))
vi.mock('@/features/skills/api/service', () => ({
  assignPackToClient: vi.fn(async () => ({ success: true, count: 5 })),
}))

describe('Dashboard Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queues.clear()
  })

  describe('getClients', () => {
    it('returns clients ordered by name', async () => {
      const rows = [{ id: '1', name: 'A', contact_email: null }]
      push('clients', { data: rows, error: null })
      expect(await getClients()).toEqual(rows)
      expect(mockSupabase.from).toHaveBeenCalledWith('clients')
    })

    it('throws on db error (fail-closed for admin list)', async () => {
      push('clients', { data: null, error: { message: 'rls denied' } })
      await expect(getClients()).rejects.toThrow('rls denied')
    })
  })

  describe('getDashboardProfile', () => {
    it('returns null for empty / sentinel clientId without hitting the db', async () => {
      expect(await getDashboardProfile('')).toBeNull()
      expect(await getDashboardProfile('undefined')).toBeNull()
      expect(await getDashboardProfile('null')).toBeNull()
      expect(mockSupabase.from).not.toHaveBeenCalled()
    })

    it('returns null when row is missing (PGRST116) — no throw during render', async () => {
      push('dashboard_profiles', { data: null, error: { code: 'PGRST116' } })
      expect(await getDashboardProfile('c1')).toBeNull()
    })

    it('returns null and logs on unexpected db error', async () => {
      const { logger } = await import('@/lib/logger')
      push('dashboard_profiles', { data: null, error: { code: 'OTHER', message: 'jwt' } })
      expect(await getDashboardProfile('c1')).toBeNull()
      expect(logger.error).toHaveBeenCalled()
    })

    it('returns the profile row on success', async () => {
      const profile = { client_id: 'c1', greeting: 'Hi' }
      push('dashboard_profiles', { data: profile, error: null })
      expect(await getDashboardProfile('c1')).toEqual(profile)
    })
  })

  describe('getDashboardProfileWithMetrics', () => {
    it('returns null when there is no profile', async () => {
      push('dashboard_profiles', { data: null, error: { code: 'PGRST116' } })
      expect(await getDashboardProfileWithMetrics('c1')).toBeNull()
    })

    it('serializes a raw metrics OBJECT into the 3 UI metrics', async () => {
      push('dashboard_profiles', {
        data: {
          client_id: 'c1',
          metrics: { total_reach: 10261, engagement_rate: 3.7, total_engagement: 379 },
        },
        error: null,
      })

      const result = await getDashboardProfileWithMetrics('c1')
      expect(result?.metrics).toHaveLength(3)
      expect(result?.metrics[0]).toMatchObject({ label: 'Total Reach', value: '10,261' })
      expect(result?.metrics[1]).toMatchObject({ label: 'Engagement Rate', value: '3.7%' })
    })

    it('passes an already-array metrics value through untouched', async () => {
      const arr = [{ label: 'Cached', value: '1' }]
      push('dashboard_profiles', { data: { client_id: 'c1', metrics: arr }, error: null })
      const result = await getDashboardProfileWithMetrics('c1')
      expect(result?.metrics).toEqual(arr)
    })
  })

  describe('createNewClient', () => {
    it('creates the client, seeds profile + brand file, and assigns starter skills', async () => {
      push('clients', { data: { id: 'new-client', name: 'Acme' }, error: null })
      push('dashboard_profiles', { error: null })
      push('client_files', { error: null })

      const result = await createNewClient({ name: 'Acme', niche: 'Fitness' })

      expect(result).toEqual({ id: 'new-client', name: 'Acme', seededSkills: 5 })
      const { assignPackToClient } = await import('@/features/skills/api/service')
      expect(assignPackToClient).toHaveBeenCalledWith('new-client', 'starter')
    })

    it('throws when the client insert fails', async () => {
      push('clients', { data: null, error: { message: 'duplicate key' } })
      await expect(createNewClient({ name: 'Acme' })).rejects.toThrow('duplicate key')
    })

    it('rejects when assertAdmin fails (non-admin caller)', async () => {
      const { assertAdmin } = await import('@/lib/auth/guard')
      vi.mocked(assertAdmin).mockRejectedValueOnce(new Error('Forbidden: hanya administrator yang memiliki akses'))

      await expect(createNewClient({ name: 'Hacked Client' })).rejects.toThrow('Forbidden: hanya administrator yang memiliki akses')
    })
  })
})
