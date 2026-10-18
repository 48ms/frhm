import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'

const mockAssertAdmin = vi.fn()
const mockListUsers = vi.fn()
const mockGetUserById = vi.fn()
const mockFrom = vi.fn()
const mockLogAudit = vi.fn()

vi.mock('@/lib/auth/guard', () => ({
  assertAdmin: () => mockAssertAdmin(),
  denyUnauthorized: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
  denyForbidden: (ctx: any) => new Response(JSON.stringify({ error: 'Forbidden', ctx }), { status: 403 }),
}))

vi.mock('@/lib/audit/log', () => ({
  logAudit: (...args: any[]) => mockLogAudit(...args),
}))

vi.mock('@/lib/supabase/service', () => ({
  createSupabaseServiceClient: () => ({
    auth: {
      admin: {
        listUsers: () => mockListUsers(),
        getUserById: (id: string) => mockGetUserById(id),
      },
    },
    from: (table: string) => mockFrom(table),
  }),
}))

vi.mock('@/lib/middleware/rate-limit', () => ({
  checkRateLimit: () => ({ limited: false }),
  getClientIp: () => '127.0.0.1',
  RATE_LIMITS: {
    mutation: { limit: 10, windowMs: 60000 },
  },
}))

describe('API /api/admin/pending-users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAssertAdmin.mockResolvedValue({ userId: 'admin-uuid-1' })
  })

  describe('GET', () => {
    it('returns list of pending waitlist users', async () => {
      mockListUsers.mockResolvedValue({
        data: {
          users: [
            {
              id: 'u-pending-1',
              email: 'bebekbek9191@gmail.com',
              created_at: '2026-09-27T00:00:00Z',
              user_metadata: { name: 'Bima Maulana Saputra' },
              app_metadata: { provider: 'google' },
            },
            {
              id: 'u-active-admin',
              email: 'dheia.buleud@gmail.com',
              created_at: '2026-09-20T00:00:00Z',
            },
          ],
        },
        error: null,
      })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                { id: 'u-active-admin', role: 'admin', client_id: null },
                { id: 'u-pending-1', role: 'client', client_id: null },
              ],
              error: null,
            }),
          }
        }
        if (table === 'clients') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'client-taraju-uuid', name: 'Taraju' }],
              error: null,
            }),
          }
        }
        return {}
      })

      const req = new Request('http://localhost:3000/api/admin/pending-users')
      const res = await GET(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.count).toBe(1)
      expect(body.pendingUsers[0].email).toBe('bebekbek9191@gmail.com')
      expect(body.clients[0].name).toBe('Taraju')
    })
  })

  describe('POST', () => {
    it('approves user as client and links to clientId', async () => {
      mockGetUserById.mockResolvedValue({
        data: {
          user: {
            id: 'ac735912-ad8f-4b8e-b2a9-a43dc5702bc8',
            email: 'bebekbek9191@gmail.com',
            user_metadata: { full_name: 'Bima Maulana Saputra' },
          },
        },
        error: null,
      })

      const mockUpsert = vi.fn().mockResolvedValue({ error: null })
      const mockSingle = vi.fn().mockResolvedValue({ data: { name: 'Taraju' }, error: null })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            upsert: mockUpsert,
          }
        }
        if (table === 'clients') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: mockSingle,
              })),
            })),
          }
        }
        return {}
      })

      const req = new Request('http://localhost:3000/api/admin/pending-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'ac735912-ad8f-4b8e-b2a9-a43dc5702bc8',
          role: 'client',
          clientId: '44b48931-a33e-470a-9f3e-9064ee46373f',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.ok).toBe(true)
      expect(body.message).toContain('Taraju')
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'ac735912-ad8f-4b8e-b2a9-a43dc5702bc8',
          role: 'client',
          client_id: '44b48931-a33e-470a-9f3e-9064ee46373f',
        })
      )
    })

    it('approves user as admin', async () => {
      mockGetUserById.mockResolvedValue({
        data: {
          user: {
            id: 'ac735912-ad8f-4b8e-b2a9-a43dc5702bc8',
            email: 'bebekbek9191@gmail.com',
          },
        },
        error: null,
      })

      const mockUpsert = vi.fn().mockResolvedValue({ error: null })
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            upsert: mockUpsert,
          }
        }
        return {}
      })

      const req = new Request('http://localhost:3000/api/admin/pending-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'ac735912-ad8f-4b8e-b2a9-a43dc5702bc8',
          role: 'admin',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)

      const body = await res.json()
      expect(body.ok).toBe(true)
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'ac735912-ad8f-4b8e-b2a9-a43dc5702bc8',
          role: 'admin',
          client_id: null,
        })
      )
    })
  })
})
