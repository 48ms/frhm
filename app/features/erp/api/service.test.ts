import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getClientBudgets, getExpenses, getAdSpendLogs, getKOLs, createExpense } from './service'

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  single: vi.fn(),
  maybeSingle: vi.fn().mockResolvedValue({ data: { name: 'Client Test' }, error: null }),
}

const mockSupabase = {
  from: vi.fn(() => mockQueryBuilder),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn() }
}))

vi.mock('@/lib/audit/log', () => ({
  logAudit: vi.fn(),
}))

vi.mock('@/lib/telegram/service', () => ({
  notifyBudgetThresholdAlert: vi.fn().mockResolvedValue({ success: true }),
}))

describe('ERP Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryBuilder.select.mockReturnThis()
    mockQueryBuilder.eq.mockReturnThis()
    mockQueryBuilder.order.mockReturnThis()
    mockQueryBuilder.insert.mockReturnThis()
    mockQueryBuilder.update.mockReturnThis()
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

  describe('createExpense', () => {
    it('inserts expense and returns success with data', async () => {
      const inserted = { id: 'exp-1', client_id: 'c1', amount: 500000, category: 'Ads' }
      mockQueryBuilder.single.mockResolvedValue({ data: inserted, error: null })

      const res = await createExpense({ client_id: 'c1', amount: 500000, category: 'Ads' })

      expect(res.success).toBe(true)
      expect(res.data).toEqual(inserted)
      expect(mockSupabase.from).toHaveBeenCalledWith('expenses')
      expect(mockQueryBuilder.insert).toHaveBeenCalled()
    })

    it('returns failure with error message when insert fails', async () => {
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: { message: 'RLS denied' } })

      const res = await createExpense({ client_id: 'c1', amount: 100 })

      expect(res.success).toBe(false)
      expect(res.error).toBe('RLS denied')
    })

    it('syncs budget remaining_balance when budget_id is provided', async () => {
      // First call (insert expense) resolves via single()
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: { id: 'exp-2', client_id: 'c1', amount: 200000, category: 'KOL' }, error: null })
        // Second call (read budget) resolves via single()
        .mockResolvedValueOnce({ data: { remaining_balance: 1000000 }, error: null })

      const res = await createExpense({ client_id: 'c1', budget_id: 'b1', amount: 200000 })

      expect(res.success).toBe(true)
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({ remaining_balance: 800000 })
      )
    })

    it('clamps remaining_balance at zero when expense exceeds budget', async () => {
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: { id: 'exp-3', client_id: 'c1', amount: 5000000, category: 'Ads' }, error: null })
        .mockResolvedValueOnce({ data: { remaining_balance: 100000 }, error: null })

      await createExpense({ client_id: 'c1', budget_id: 'b1', amount: 5000000 })

      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({ remaining_balance: 0 })
      )
    })

    it('triggers budget threshold alert when spent reaches or exceeds 90%', async () => {
      const { notifyBudgetThresholdAlert } = await import('@/lib/telegram/service')
      mockQueryBuilder.single
        .mockResolvedValueOnce({ data: { id: 'exp-4', client_id: 'c1', amount: 950000, category: 'Ads' }, error: null })
        .mockResolvedValueOnce({ data: { total_budget: 1000000, remaining_balance: 1000000 }, error: null })

      const res = await createExpense({ client_id: 'c1', budget_id: 'b1', amount: 950000 })

      expect(res.success).toBe(true)
      expect(res.warning).toBeDefined()
      expect(notifyBudgetThresholdAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 'c1',
          totalBudget: 1000000,
          remainingBalance: 50000,
          spentPercentage: 95,
          expenseAmount: 950000,
        })
      )
    })
  })
})
