import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useCreateExpense, useAddAdSpendLog, erpKeys } from './queries'
import * as erpService from './service'
import type { Expense, ClientBudget, AdSpendLog } from './types'

vi.mock('./service', () => ({
  getClientBudgets: vi.fn(),
  getExpenses: vi.fn(),
  getAdSpendLogs: vi.fn(),
  getKOLs: vi.fn(),
  createExpense: vi.fn(),
  addAdSpendLog: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  return { queryClient, wrapper }
}

describe('ERP Queries & Optimistic Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useCreateExpense', () => {
    it('optimistically prepends expense and deducts budget, then confirms on success', async () => {
      const { queryClient, wrapper } = createTestWrapper()
      const clientId = 'client-alpha'
      const budgetId = 'budget-101'

      const initialBudgets: ClientBudget[] = [
        {
          id: budgetId,
          client_id: clientId,
          month: '2026-10-01',
          total_budget: 10000000,
          remaining_balance: 8000000,
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
      ]
      const initialExpenses: Expense[] = [
        {
          id: 'exp-1',
          client_id: clientId,
          budget_id: budgetId,
          amount: 500000,
          category: 'ads',
          description: 'Meta Ads setup',
          expense_date: '2026-10-05T00:00:00Z',
          created_at: '2026-10-05T00:00:00Z',
        },
      ]

      queryClient.setQueryData(erpKeys.budgets(clientId), initialBudgets)
      queryClient.setQueryData(erpKeys.expenses(clientId), initialExpenses)

      vi.mocked(erpService.createExpense).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: {
                    id: 'exp-real-999',
                    client_id: clientId,
                    budget_id: budgetId,
                    amount: 1500000,
                    category: 'production',
                    description: 'Video shoot',
                    expense_date: '2026-10-15T00:00:00Z',
                    created_at: '2026-10-15T00:00:00Z',
                  },
                }),
              50
            )
          )
      )

      const { result } = renderHook(() => useCreateExpense(), { wrapper })

      // Trigger mutation
      result.current.mutate({
        client_id: clientId,
        budget_id: budgetId,
        amount: 1500000,
        category: 'production',
        description: 'Video shoot',
      })

      // Immediate in-flight optimistic update
      await waitFor(() => {
        const optimisticExpenses = queryClient.getQueryData<Expense[]>(erpKeys.expenses(clientId))
        expect(optimisticExpenses).toHaveLength(2)
        expect(optimisticExpenses?.[0].amount).toBe(1500000)
        expect(optimisticExpenses?.[0].id).toMatch(/^temp-/)

        const optimisticBudgets = queryClient.getQueryData<ClientBudget[]>(erpKeys.budgets(clientId))
        expect(optimisticBudgets?.[0].remaining_balance).toBe(6500000) // 8000000 - 1500000
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })

    it('rolls back optimistic expense and budget balance when server rejects', async () => {
      const { queryClient, wrapper } = createTestWrapper()
      const clientId = 'client-beta'
      const budgetId = 'budget-202'

      const initialBudgets: ClientBudget[] = [
        {
          id: budgetId,
          client_id: clientId,
          month: '2026-10-01',
          total_budget: 5000000,
          remaining_balance: 4000000,
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
      ]
      const initialExpenses: Expense[] = []

      queryClient.setQueryData(erpKeys.budgets(clientId), initialBudgets)
      queryClient.setQueryData(erpKeys.expenses(clientId), initialExpenses)

      vi.mocked(erpService.createExpense).mockRejectedValue(new Error('Database RLS timeout'))

      const { result } = renderHook(() => useCreateExpense(), { wrapper })

      result.current.mutate({
        client_id: clientId,
        budget_id: budgetId,
        amount: 1000000,
        description: 'Influencer payment',
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      // Verifikasi rollback ke nilai awal
      const rolledBackExpenses = queryClient.getQueryData<Expense[]>(erpKeys.expenses(clientId))
      expect(rolledBackExpenses).toEqual([])

      const rolledBackBudgets = queryClient.getQueryData<ClientBudget[]>(erpKeys.budgets(clientId))
      expect(rolledBackBudgets?.[0].remaining_balance).toBe(4000000)
    })
  })

  describe('useAddAdSpendLog', () => {
    it('optimistically prepends ad spend log and rolls back on failure', async () => {
      const { queryClient, wrapper } = createTestWrapper()
      const clientId = 'client-gamma'

      const initialLogs: AdSpendLog[] = [
        {
          id: 'log-1',
          client_id: clientId,
          campaign_name: 'Taraju Awareness',
          spend: 300000,
          clicks: 120,
          log_date: '2026-10-10',
          created_at: '2026-10-10T00:00:00Z',
        },
      ]

      queryClient.setQueryData(erpKeys.adSpend(clientId), initialLogs)

      vi.mocked(erpService.addAdSpendLog).mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network error')), 50)
          )
      )

      const { result } = renderHook(() => useAddAdSpendLog(), { wrapper })

      result.current.mutate({
        client_id: clientId,
        campaign_name: 'Pawon Sengon Retargeting',
        spend: 450000,
        clicks: 210,
      })

      // Immediate in-flight optimistic check
      await waitFor(() => {
        const optimisticLogs = queryClient.getQueryData<AdSpendLog[]>(erpKeys.adSpend(clientId))
        expect(optimisticLogs).toHaveLength(2)
        expect(optimisticLogs?.[0].campaign_name).toBe('Pawon Sengon Retargeting')
      })

      await waitFor(() => expect(result.current.isError).toBe(true))

      // Rollback check
      const rolledBackLogs = queryClient.getQueryData<AdSpendLog[]>(erpKeys.adSpend(clientId))
      expect(rolledBackLogs).toEqual(initialLogs)
    })
  })
})
