import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getClientBudgets, getExpenses, getAdSpendLogs, getKOLs } from './service'

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
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

describe('ERP Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryBuilder.select.mockReturnThis()
    mockQueryBuilder.eq.mockReturnThis()
    mockQueryBuilder.order.mockReturnThis()
  })

  const readTests = [
    { name: 'getClientBudgets', fn: getClientBudgets, table: 'client_budgets', orderCol: 'month' },
    { name: 'getExpenses', fn: getExpenses, table: 'expenses', orderCol: 'expense_date' },
    { name: 'getAdSpendLogs', fn: getAdSpendLogs, table: 'ad_spend_logs', orderCol: 'log_date' },
    { name: 'getKOLs', fn: getKOLs, table: 'kols', orderCol: 'created_at' },
  ]

  readTests.forEach(({ name, fn, table, orderCol }) => {
    it(`${name} returns empty array if clientId is missing`, async () => {
      const result = await fn('')
      expect(result).toEqual([])
    })

    it(`${name} returns data when Supabase succeeds`, async () => {
      const mockData = [{ id: '1' }]
      mockQueryBuilder.order.mockResolvedValue({ data: mockData, error: null })
      
      const result = await fn('client-1')
      expect(result).toEqual(mockData)
      expect(mockSupabase.from).toHaveBeenCalledWith(table)
      expect(mockQueryBuilder.order).toHaveBeenCalledWith(orderCol, { ascending: false })
    })

    it(`${name} returns empty array on error and logs it`, async () => {
      const { logger } = await import('@/lib/logger')
      mockQueryBuilder.order.mockResolvedValue({ data: null, error: new Error('db error') })
      
      const result = await fn('client-1')
      expect(result).toEqual([])
      expect(logger.error).toHaveBeenCalled()
    })
  })
})
