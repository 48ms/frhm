import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateAssetCaption } from '@/features/library/api/ai'

let mockUser: { id: string } | null = { id: 'u-1' }
let mockRole: 'admin' | 'client' = 'admin'
let mockClientId = 'client-A'

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: mockUser } }) },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { role: mockRole, client_id: mockClientId },
            error: null,
          }),
        }),
      }),
    }),
  }),
}))

function mockFetch(response: { ok: boolean; status?: number; json?: unknown }) {
  return vi.fn(async () => ({
    ok: response.ok,
    status: response.status ?? (response.ok ? 200 : 500),
    json: async () => response.json ?? {},
  }))
}

beforeEach(() => {
  mockUser = { id: 'u-1' }
  mockRole = 'admin'
  mockClientId = 'client-A'
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('generateAssetCaption', () => {
  it('rejects a caller with no session', async () => {
    mockUser = null
    const res = await generateAssetCaption('client-A', 'https://x/y.jpg', 'image')
    expect(res.caption).toBe('')
    expect(res.error).toMatch(/Unauthorized/i)
  })

  it('rejects a client user targeting another tenant', async () => {
    mockRole = 'client'
    mockClientId = 'client-A'
    const res = await generateAssetCaption('client-B', 'https://x/y.jpg', 'image')
    expect(res.caption).toBe('')
    expect(res.error).toMatch(/Forbidden/i)
  })

  it('refuses video without calling the provider', async () => {
    const fetchSpy = mockFetch({ ok: true })
    vi.stubGlobal('fetch', fetchSpy)
    const res = await generateAssetCaption('client-A', 'https://x/y.mp4', 'video')
    expect(res.caption).toBe('')
    expect(res.error).toMatch(/video/i)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('returns the model caption on success', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch({ ok: true, json: { choices: [{ message: { content: 'Opsi 1: Halo #kopi' } }] } })
    )
    const res = await generateAssetCaption('client-A', 'https://x/y.jpg', 'image')
    expect(res.error).toBeUndefined()
    expect(res.caption).toBe('Opsi 1: Halo #kopi')
  })

  it('fails closed when the provider returns a non-2xx status', async () => {
    vi.stubGlobal('fetch', mockFetch({ ok: false, status: 503 }))
    const res = await generateAssetCaption('client-A', 'https://x/y.jpg', 'image')
    expect(res.caption).toBe('')
    expect(res.error).toMatch(/503/)
  })

  it('fails closed when the model returns empty content', async () => {
    vi.stubGlobal('fetch', mockFetch({ ok: true, json: { choices: [{ message: { content: '  ' } }] } }))
    const res = await generateAssetCaption('client-A', 'https://x/y.jpg', 'image')
    expect(res.caption).toBe('')
    expect(res.error).toBeTruthy()
  })
})
