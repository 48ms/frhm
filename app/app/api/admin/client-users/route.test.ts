import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST, DELETE } from './route'

const mockAssertAdmin = vi.fn()
const mockCreateClient = vi.fn()
const mockLogAudit = vi.fn()

vi.mock('@/lib/auth/guard', () => ({
  assertAdmin: () => mockAssertAdmin(),
  denyUnauthorized: () => new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }),
  denyForbidden: (ctx: any) => new Response(JSON.stringify({ error: 'Forbidden', ctx }), { status: 403 }),
}))

vi.mock('@/lib/audit/log', () => ({
  logAudit: (...args: any[]) => mockLogAudit(...args),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

vi.mock('@/lib/middleware/rate-limit', () => ({
  checkRateLimit: () => ({ limited: false }),
  getClientIp: () => '127.0.0.1',
  RATE_LIMITS: {
    mutation: { limit: 10, windowMs: 60000 },
  },
}))

describe('API /api/admin/client-users', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAssertAdmin.mockResolvedValue({ userId: 'admin-uuid-1' })
  })

  describe('GET', () => {
    it('returns 400 if clientId is missing', async () => {
      const req = new Request('http://localhost:3000/api/admin/client-users')
      const res = await GET(req)
      expect(res.status).toBe(400)
    })

    it('returns users list when valid clientId is provided', async () => {
      const mockUsers = [
        { id: 'u-1', email: 'adit@taraju.com', full_name: 'Pak Adit', role: 'client', client_id: 'c-taraju' },
      ]

      mockCreateClient.mockResolvedValue({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
            })),
          })),
        })),
      })

      const req = new Request('http://localhost:3000/api/admin/client-users?clientId=c-taraju')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.users).toEqual(mockUsers)
    })

    it('returns 403 if user is not admin', async () => {
      mockAssertAdmin.mockRejectedValue(new Error('Forbidden: hanya administrator'))
      const req = new Request('http://localhost:3000/api/admin/client-users?clientId=c-taraju')
      const res = await GET(req)
      expect(res.status).toBe(403)
    })
  })

  describe('POST', () => {
    it('returns 400 for invalid email', async () => {
      const req = new Request('http://localhost:3000/api/admin/client-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'c-taraju', email: 'not-an-email', fullName: 'Pak Adit' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('successfully updates existing user and logs audit', async () => {
      const existing = { id: 'u-1', email: 'adit@taraju.com', client_id: null, role: null }
      const updated = { id: 'u-1', email: 'adit@taraju.com', client_id: 'c-taraju', role: 'client', full_name: 'Pak Adit' }

      mockCreateClient.mockResolvedValue({
        from: vi.fn((table: string) => {
          if (table === 'users') {
            return {
              select: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn().mockResolvedValue({ data: existing }),
                })),
              })),
              update: vi.fn(() => ({
                eq: vi.fn(() => ({
                  select: vi.fn(() => ({
                    single: vi.fn().mockResolvedValue({ data: updated, error: null }),
                  })),
                })),
              })),
            }
          }
          return {}
        }),
      })

      const req = new Request('http://localhost:3000/api/admin/client-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: 'c-taraju', email: 'adit@taraju.com', fullName: 'Pak Adit' }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.ok).toBe(true)
      expect(data.user).toEqual(updated)
      expect(mockLogAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'client.user_assigned',
          actorId: 'admin-uuid-1',
        })
      )
    })
  })

  describe('DELETE', () => {
    it('returns 400 if userId or clientId is missing', async () => {
      const req = new Request('http://localhost:3000/api/admin/client-users?userId=u-1')
      const res = await DELETE(req)
      expect(res.status).toBe(400)
    })

    it('unbinds user and logs audit', async () => {
      mockCreateClient.mockResolvedValue({
        from: vi.fn(() => ({
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            })),
          })),
        })),
      })

      const req = new Request('http://localhost:3000/api/admin/client-users?userId=u-1&clientId=c-taraju', {
        method: 'DELETE',
      })
      const res = await DELETE(req)
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.ok).toBe(true)
      expect(mockLogAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'client.user_revoked',
          actorId: 'admin-uuid-1',
        })
      )
    })
  })
})
