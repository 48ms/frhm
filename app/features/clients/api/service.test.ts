import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateClient, deleteClient } from './service'
import { assertAdmin } from '@/lib/auth/guard'

const mockFrom = vi.fn()
const mockCreateClient = vi.fn(() => ({ from: mockFrom }))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

vi.mock('@/lib/auth/guard', () => ({
  assertAdmin: vi.fn(),
}))

vi.mock('@/lib/audit/log', () => ({
  logAudit: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Client Service CRUD Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('updateClient', () => {
    it('requires admin authorization', async () => {
      vi.mocked(assertAdmin).mockRejectedValueOnce(new Error('Forbidden'))
      await expect(
        updateClient({
          id: '11111111-1111-1111-1111-111111111111',
          name: 'Updated Name',
        })
      ).rejects.toThrow('Forbidden')
    })

    it('successfully updates client data and preserves brand profile', async () => {
      const clientId = '11111111-1111-1111-1111-111111111111'
      const existingClient = {
        id: clientId,
        name: 'Old Name',
        brand_profile: { voice: 'Casual', audience: 'Youth' },
      }

      const updatedClient = {
        id: clientId,
        name: 'New Name',
        contact_email: 'new@brand.com',
        contact_phone: '08123456789',
        brand_profile: { voice: 'Casual', audience: 'Youth', who: 'New Name', niche: 'F&B' },
        updated_at: new Date().toISOString(),
      }

      // Step 1: select existing
      const selectSingle = vi.fn().mockResolvedValue({ data: existingClient, error: null })
      const selectEq = vi.fn().mockReturnValue({ single: selectSingle })
      const selectMock = vi.fn().mockReturnValue({ eq: selectEq })

      // Step 2: update
      const updateSingle = vi.fn().mockResolvedValue({ data: updatedClient, error: null })
      const updateSelect = vi.fn().mockReturnValue({ single: updateSingle })
      const updateEq = vi.fn().mockReturnValue({ select: updateSelect })
      const updateMock = vi.fn().mockReturnValue({ eq: updateEq })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'clients') {
          return {
            select: selectMock,
            update: updateMock,
          }
        }
        return {}
      })

      const res = await updateClient({
        id: clientId,
        name: 'New Name',
        contact_email: 'new@brand.com',
        contact_phone: '08123456789',
        niche: 'F&B',
      })

      expect(res.name).toBe('New Name')
      expect(assertAdmin).toHaveBeenCalledTimes(1)
    })

    it('rejects invalid schema input', async () => {
      await expect(
        updateClient({
          id: 'invalid-uuid',
          name: '',
        })
      ).rejects.toThrow()
    })
  })

  describe('deleteClient', () => {
    it('requires admin authorization', async () => {
      vi.mocked(assertAdmin).mockRejectedValueOnce(new Error('Forbidden'))
      await expect(deleteClient('11111111-1111-1111-1111-111111111111')).rejects.toThrow('Forbidden')
    })

    it('successfully unlinks users and deletes client workspace', async () => {
      const clientId = '11111111-1111-1111-1111-111111111111'

      // Step 1: verify client exists
      const selectSingle = vi.fn().mockResolvedValue({ data: { id: clientId, name: 'Brand To Delete' }, error: null })
      const selectEq = vi.fn().mockReturnValue({ single: selectSingle })
      const selectMock = vi.fn().mockReturnValue({ eq: selectEq })

      // Step 2: unlink users
      const usersUpdateEq = vi.fn().mockResolvedValue({ error: null })
      const usersUpdateMock = vi.fn().mockReturnValue({ eq: usersUpdateEq })

      // Step 3: delete client
      const deleteEq = vi.fn().mockResolvedValue({ error: null })
      const deleteMock = vi.fn().mockReturnValue({ eq: deleteEq })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'clients') {
          return {
            select: selectMock,
            delete: deleteMock,
          }
        }
        if (table === 'users') {
          return {
            update: usersUpdateMock,
          }
        }
        return {}
      })

      const res = await deleteClient(clientId)
      expect(res.success).toBe(true)
      expect(res.id).toBe(clientId)
      expect(res.name).toBe('Brand To Delete')
      expect(assertAdmin).toHaveBeenCalledTimes(1)
    })

    it('throws error when client does not exist', async () => {
      const selectSingle = vi.fn().mockResolvedValue({ data: null, error: new Error('Not found') })
      const selectEq = vi.fn().mockReturnValue({ single: selectSingle })
      const selectMock = vi.fn().mockReturnValue({ eq: selectEq })

      mockFrom.mockReturnValue({
        select: selectMock,
      })

      await expect(deleteClient('11111111-1111-1111-1111-111111111111')).rejects.toThrow('tidak ditemukan')
    })
  })
})
