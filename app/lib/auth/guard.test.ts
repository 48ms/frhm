import { describe, it, expect, vi, beforeEach } from 'vitest'
import { assertAdmin, assertClientAccess, denyUnauthorized, denyForbidden } from './guard'

const mockAuthGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockAuthGetUser,
    },
    from: mockFrom,
  })),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('lib/auth/guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('denyUnauthorized & denyForbidden', () => {
    it('returns 401 for denyUnauthorized', () => {
      const res = denyUnauthorized({ route: 'test/route' })
      expect(res.status).toBe(401)
    })

    it('returns 403 for denyForbidden', () => {
      const res = denyForbidden({ route: 'test/route' })
      expect(res.status).toBe(403)
    })
  })

  describe('assertAdmin', () => {
    it('rejects when there is no active session', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: null })
      await expect(assertAdmin()).rejects.toThrow('Unauthorized')
    })

    it('rejects when user has role !== admin', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u-1' } }, error: null })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { role: 'client' }, error: null }),
          }),
        }),
      })

      await expect(assertAdmin()).rejects.toThrow('Forbidden')
    })

    it('resolves successfully when user has role === admin', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
          }),
        }),
      })

      const res = await assertAdmin()
      expect(res.userId).toBe('admin-1')
    })
  })

  describe('assertClientAccess', () => {
    it('rejects when no clientId is provided', async () => {
      await expect(assertClientAccess('')).rejects.toThrow('Client ID wajib')
    })

    it('rejects when there is no active session', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null }, error: null })
      await expect(assertClientAccess('c-1')).rejects.toThrow('Unauthorized')
    })

    it('accepts admin accessing any client', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'admin-1' } }, error: null })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { role: 'admin', client_id: null }, error: null }),
          }),
        }),
      })

      const res = await assertClientAccess('any-client-id')
      expect(res.userId).toBe('admin-1')
      expect(res.role).toBe('admin')
      expect(res.clientId).toBe('any-client-id')
    })

    it('accepts client accessing their own clientId', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'client-user-1' } }, error: null })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { role: 'client', client_id: 'client-123' }, error: null }),
          }),
        }),
      })

      const res = await assertClientAccess('client-123')
      expect(res.userId).toBe('client-user-1')
      expect(res.role).toBe('client')
      expect(res.clientId).toBe('client-123')
    })

    it('rejects client accessing another clientId (cross-tenant attack)', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'client-user-1' } }, error: null })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { role: 'client', client_id: 'client-123' }, error: null }),
          }),
        }),
      })

      await expect(assertClientAccess('client-999')).rejects.toThrow('Forbidden: Anda tidak memiliki akses ke klien ini')
    })
  })
})
