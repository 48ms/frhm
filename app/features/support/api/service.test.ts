import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSupportTicketsByClient, createSupportTicket } from './service'
import type { CreateSupportTicketInput } from './types'

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

const mockSupabase = {
  from: vi.fn(() => mockQueryBuilder),
  auth: { getUser: vi.fn() },
}

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn(() => mockSupabase) }))
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }))
vi.mock('@/lib/audit/log', () => ({ logAudit: vi.fn() }))

describe('Support Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryBuilder.select.mockReturnThis()
    mockQueryBuilder.eq.mockReturnThis()
    mockQueryBuilder.order.mockReturnThis()
    mockQueryBuilder.insert.mockReturnThis()
  })

  describe('getSupportTicketsByClient', () => {
    it('returns empty array if clientId is missing', async () => {
      expect(await getSupportTicketsByClient('')).toEqual([])
    })

    it('returns tickets for the client', async () => {
      const rows = [{ id: 't1', subject: 'Help' }]
      mockQueryBuilder.order.mockResolvedValue({ data: rows, error: null })
      expect(await getSupportTicketsByClient('c1')).toEqual(rows)
      expect(mockSupabase.from).toHaveBeenCalledWith('support_tickets')
    })

    it('degrades to [] and logs on db error', async () => {
      const { logger } = await import('@/lib/logger')
      mockQueryBuilder.order.mockResolvedValue({ data: null, error: { message: 'boom' } })
      expect(await getSupportTicketsByClient('c1')).toEqual([])
      expect(logger.error).toHaveBeenCalled()
    })
  })

  describe('createSupportTicket', () => {
    const input: CreateSupportTicketInput = {
      clientId: 'c1',
      subject: 'Hi',
      message: 'x',
      priority: 'Low',
    }

    it('rejects unauthenticated callers (fail-closed)', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      await expect(createSupportTicket(input)).rejects.toThrow('Unauthorized')
    })

    it('inserts a ticket stamped with the authenticated user id', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockQueryBuilder.single.mockResolvedValue({
        data: { id: 't1', subject: 'Hi', status: 'open' },
        error: null,
      })

      const result = await createSupportTicket({
        clientId: 'c1',
        subject: '  Hi  ',
        message: '  body  ',
        priority: 'Low',
      })

      expect(result.id).toBe('t1')
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({ created_by: 'user-1', subject: 'Hi', message: 'body', status: 'open' })
      )
    })

    it('throws a safe message on db error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: { message: 'db down' } })
      await expect(createSupportTicket(input)).rejects.toThrow('Gagal menyimpan tiket dukungan')
    })
  })
})
