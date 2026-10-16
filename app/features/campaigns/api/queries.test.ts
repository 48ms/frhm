import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  campaignKeys,
} from './queries'
import * as campaignService from './service'
import type { Campaign } from './types'

vi.mock('./service', () => ({
  getCampaigns: vi.fn(),
  createCampaign: vi.fn(),
  updateCampaign: vi.fn(),
  deleteCampaign: vi.fn(),
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

describe('Campaigns Queries & Optimistic Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('optimistically prepends a new campaign and rolls back on failure', async () => {
    const { queryClient, wrapper } = createTestWrapper()
    const clientId = 'client-taraju'

    queryClient.setQueryData(campaignKeys.byClient(clientId), [])

    vi.mocked(campaignService.createCampaign).mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Campaign creation failed')), 50)
        )
    )

    const { result } = renderHook(() => useCreateCampaign(), { wrapper })

    result.current.mutate({
      client_id: clientId,
      name: 'Autumn Flash Sale',
      type: 'campaign',
      start_date: null,
      end_date: null,
      color: null,
      notes: null,
    })

    // In-flight optimistic check
    await waitFor(() => {
      const optimisticCampaigns = queryClient.getQueryData<Campaign[]>(campaignKeys.byClient(clientId))
      expect(optimisticCampaigns).toHaveLength(1)
      expect(optimisticCampaigns?.[0].name).toBe('Autumn Flash Sale')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Rollback check
    const rolledBack = queryClient.getQueryData<Campaign[]>(campaignKeys.byClient(clientId))
    expect(rolledBack).toEqual([])
  })

  it('optimistically updates campaign name and rolls back on failure', async () => {
    const { queryClient, wrapper } = createTestWrapper()
    const campaignId = 'camp-1'

    const initialCampaigns: Campaign[] = [
      {
        id: campaignId,
        client_id: 'client-taraju',
        name: 'Initial Name',
        type: 'campaign',
        start_date: null,
        end_date: null,
        color: null,
        notes: null,
        created_at: '2026-10-01T00:00:00Z',
      },
    ]

    queryClient.setQueryData(campaignKeys.all, initialCampaigns)

    vi.mocked(campaignService.updateCampaign).mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Update failed')), 50)
        )
    )

    const { result } = renderHook(() => useUpdateCampaign(), { wrapper })

    result.current.mutate({
      id: campaignId,
      patch: { name: 'Optimistic Name' },
    })

    // In-flight optimistic check
    await waitFor(() => {
      const optimisticCampaigns = queryClient.getQueryData<Campaign[]>(campaignKeys.all)
      expect(optimisticCampaigns?.[0].name).toBe('Optimistic Name')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Rollback check
    const rolledBack = queryClient.getQueryData<Campaign[]>(campaignKeys.all)
    expect(rolledBack?.[0].name).toBe('Initial Name')
  })

  it('optimistically removes campaign and rolls back on failure', async () => {
    const { queryClient, wrapper } = createTestWrapper()
    const campaignId = 'camp-delete-me'

    const initialCampaigns: Campaign[] = [
      {
        id: campaignId,
        client_id: 'client-taraju',
        name: 'To Delete',
        type: 'campaign',
        start_date: null,
        end_date: null,
        color: null,
        notes: null,
        created_at: '2026-10-01T00:00:00Z',
      },
    ]

    queryClient.setQueryData(campaignKeys.all, initialCampaigns)

    vi.mocked(campaignService.deleteCampaign).mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Delete failed')), 50)
        )
    )

    const { result } = renderHook(() => useDeleteCampaign(), { wrapper })

    result.current.mutate({ id: campaignId })

    // In-flight optimistic check
    await waitFor(() => {
      const optimisticCampaigns = queryClient.getQueryData<Campaign[]>(campaignKeys.all)
      expect(optimisticCampaigns).toHaveLength(0)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Rollback check
    const rolledBack = queryClient.getQueryData<Campaign[]>(campaignKeys.all)
    expect(rolledBack).toEqual(initialCampaigns)
  })
})
