import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCampaigns, createCampaign, deleteCampaign } from './service'
import type { CreateCampaignInput } from './types'

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

const mockSupabase = {
  from: vi.fn(() => mockQueryBuilder),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn() }
}))

vi.mock('@/lib/audit/log', () => ({
  logAudit: vi.fn()
}))

describe('Campaigns Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryBuilder.select.mockReturnThis()
    mockQueryBuilder.eq.mockReturnThis()
    mockQueryBuilder.order.mockReturnThis()
    mockQueryBuilder.insert.mockReturnThis()
    mockQueryBuilder.update.mockReturnThis()
    mockQueryBuilder.delete.mockReturnThis()
  })

  describe('getCampaigns', () => {
    it('returns empty array if clientId is missing', async () => {
      const result = await getCampaigns('')
      expect(result).toEqual([])
    })

    it('returns campaigns when Supabase succeeds', async () => {
      const mockData = [{ id: '1', name: 'Test' }]
      mockQueryBuilder.order.mockResolvedValue({ data: mockData, error: null })
      
      const result = await getCampaigns('client-1')
      expect(result).toEqual(mockData)
    })
  })

  describe('createCampaign', () => {
    it('successfully inserts a campaign', async () => {
      const input: CreateCampaignInput = {
        client_id: 'c1',
        name: 'New Campaign',
        type: 'promo',
        start_date: null,
        end_date: null,
        color: null,
        notes: null,
      }
      mockQueryBuilder.single.mockResolvedValue({ data: { id: 'new-id', ...input }, error: null })

      const result = await createCampaign(input)
      expect(result.id).toBe('new-id')
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(input)
    })
  })

  describe('deleteCampaign', () => {
    it('successfully deletes a campaign', async () => {
      mockQueryBuilder.eq.mockResolvedValue({ error: null })
      await deleteCampaign('id-1')
      expect(mockQueryBuilder.delete).toHaveBeenCalled()
    })
  })
})
