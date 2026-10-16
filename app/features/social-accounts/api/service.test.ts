import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getClientsWithChannels,
  connectDirectChannel,
  disconnectChannel,
  syncChannel,
  updateBrandProfile,
  generateBrandProfile,
} from './service'

/**
 * Per-table queued mock: `from(table)` → chainable thenable builder.
 * Terminal `.single()` OR bare `await` shift the next queued result for that
 * table, so multi-query flows (incl. Promise.all) are scripted deterministically.
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
vi.mock('@/lib/ai/server', () => ({ resolveProvider: vi.fn(async () => ({ id: 'p1' })) }))
vi.mock('@/lib/ai/providers', () => ({ chatJson: vi.fn() }))

describe('Social Accounts Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queues.clear()
  })

  describe('getClientsWithChannels', () => {
    it('merges channels + dashboard audience_size via Maps (O(n+m))', async () => {
      push('clients', { data: [{ id: 'c1', name: 'Acme' }], error: null })
      push('client_channels', { data: [{ id: 'ch1', client_id: 'c1', platform: 'Instagram' }], error: null })
      push('dashboard_profiles', { data: [{ client_id: 'c1', metrics: { audience_size: 10261 } }], error: null })

      const result = await getClientsWithChannels()
      expect(result).toHaveLength(1)
      expect(result[0].channels).toHaveLength(1)
      expect(result[0].dashboard_profile).toEqual({ audience_size: 10261 })
    })

    it('degrades to [] when the clients query fails', async () => {
      const { logger } = await import('@/lib/logger')
      push('clients', { data: null, error: { message: 'boom' } })
      push('client_channels', { data: [], error: null })
      push('dashboard_profiles', { data: [], error: null })

      expect(await getClientsWithChannels()).toEqual([])
      expect(logger.error).toHaveBeenCalled()
    })

    it('returns clients with empty channels when the channels query fails', async () => {
      push('clients', { data: [{ id: 'c1', name: 'Acme' }], error: null })
      push('client_channels', { data: null, error: { message: 'boom' } })
      push('dashboard_profiles', { data: [], error: null })

      const result = await getClientsWithChannels()
      expect(result).toEqual([{ id: 'c1', name: 'Acme', channels: [] }])
    })
  })

  describe('disconnectChannel', () => {
    it('looks up the client then deletes the channel', async () => {
      push('client_channels', { data: { client_id: 'c1' }, error: null }) // select lookup
      push('client_channels', { error: null }) // delete

      await disconnectChannel('ch1')
      expect(mockSupabase.from).toHaveBeenCalledWith('client_channels')
    })

    it('throws on delete error', async () => {
      push('client_channels', { data: { client_id: 'c1' }, error: null })
      push('client_channels', { error: { message: 'fk' } })
      await expect(disconnectChannel('ch1')).rejects.toThrow('fk')
    })
  })

  describe('connectDirectChannel', () => {
    it('upserts into client_channels with terhubung status and formatted handle', async () => {
      const mockResult = {
        id: 'ch-new',
        client_id: 'c1',
        platform: 'instagram',
        handle: '@taraju_coffee',
        status: 'terhubung',
        confirmed_at: '2026-10-16T00:00:00.000Z',
      }
      push('client_channels', { data: mockResult, error: null })

      const res = await connectDirectChannel({
        clientId: 'c1',
        platform: 'Instagram',
        handle: 'taraju_coffee',
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('client_channels')
      expect(res).toEqual(mockResult)
    })

    it('throws when the upsert fails', async () => {
      push('client_channels', { data: null, error: { message: 'db error' } })

      await expect(
        connectDirectChannel({
          clientId: 'c1',
          platform: 'tiktok',
          handle: '@frhm',
        })
      ).rejects.toThrow('db error')
    })
  })

  describe('syncChannel', () => {
    it('throws when the channel is not found', async () => {
      push('client_channels', { data: null, error: { message: 'not found' } })
      await expect(syncChannel('ch1')).rejects.toThrow('not found')
    })

    it('refreshes direct channel status when client has no Ayrshare profile key', async () => {
      push('client_channels', { data: { client_id: 'c1', platform: 'Instagram' }, error: null })
      push('clients', { data: { ayrshare_profile_key: null }, error: null })
      push('client_channels', { error: null }) // update

      await expect(syncChannel('ch1')).resolves.toBeUndefined()
    })

    it('throws when AYRSHARE_API_KEY is not configured and Ayrshare profile key is present', async () => {
      const prev = process.env.AYRSHARE_API_KEY
      delete process.env.AYRSHARE_API_KEY
      push('client_channels', { data: { client_id: 'c1', platform: 'Instagram' }, error: null })
      push('clients', { data: { ayrshare_profile_key: 'pk' }, error: null })

      await expect(syncChannel('ch1')).rejects.toThrow('Ayrshare API key not configured')
      if (prev !== undefined) process.env.AYRSHARE_API_KEY = prev
    })
  })

  describe('updateBrandProfile', () => {
    it('writes JSONB on clients and upserts the markdown file', async () => {
      push('clients', { error: null }) // update .eq()
      push('client_files', { error: null }) // upsert .eq()

      await updateBrandProfile('c1', {
        who: 'Acme', audience: 'A', voice: 'V', pov: 'P', proof: 'Pr', guardrails: 'G', pillars: ['x'],
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('clients')
      expect(mockSupabase.from).toHaveBeenCalledWith('client_files')
    })

    it('throws when the clients update fails', async () => {
      push('clients', { error: { message: 'rls' } })
      await expect(
        updateBrandProfile('c1', { who: '', audience: '', voice: '', pov: '', proof: '', guardrails: '', pillars: [] })
      ).rejects.toThrow('rls')
    })
  })

  describe('generateBrandProfile', () => {
    it('returns an error object when no AI provider is configured', async () => {
      const { resolveProvider } = await import('@/lib/ai/server')
      vi.mocked(resolveProvider).mockResolvedValueOnce(null)

      const result = await generateBrandProfile({ rawMaterial: 'x' })
      expect(result).toEqual({ error: expect.stringContaining('AI Provider belum dikonfigurasi') })
    })

    it('returns a validated profile on success', async () => {
      const { chatJson } = await import('@/lib/ai/providers')
      vi.mocked(chatJson).mockResolvedValueOnce({
        who: 'Acme', audience: 'A', voice: 'V', pov: 'P', proof: 'Pr', guardrails: 'G', pillars: ['x', 'y'],
      })

      const result = await generateBrandProfile({ rawMaterial: 'x' })
      expect(result.profile).toMatchObject({ who: 'Acme', pillars: ['x', 'y'] })
    })

    it('returns an error when the AI output fails schema validation', async () => {
      const { chatJson } = await import('@/lib/ai/providers')
      vi.mocked(chatJson).mockResolvedValueOnce({ who: 'Acme' })

      const result = await generateBrandProfile({ rawMaterial: 'x' })
      expect(result).toEqual({ error: expect.stringContaining('tidak sesuai') })
    })

    it('returns an error object (never throws) when the provider call rejects', async () => {
      const { chatJson } = await import('@/lib/ai/providers')
      vi.mocked(chatJson).mockRejectedValueOnce(new Error('rate limited'))

      const result = await generateBrandProfile({ rawMaterial: 'x' })
      expect(result).toEqual({ error: 'rate limited' })
    })
  })
})
