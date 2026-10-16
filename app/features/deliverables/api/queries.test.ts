import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useUpdateDeliverableStatus, deliverableKeys } from './queries'
import * as deliverableService from './service'
import type { Deliverable } from './types'

vi.mock('./service', () => ({
  getDeliverablesByClient: vi.fn(),
  getDeliverableById: vi.fn(),
  promoteSkillOutputToDeliverable: vi.fn(),
  updateDeliverableStatus: vi.fn(),
  submitDeliverableReview: vi.fn(),
  scheduleApprovedDeliverable: vi.fn(),
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

describe('Deliverables Queries & Optimistic Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('optimistically marks deliverable as approved and sets approved_at', async () => {
    const { queryClient, wrapper } = createTestWrapper()
    const clientId = 'client-1'
    const deliverableId = 'deliv-100'

    const initialDeliverables: Deliverable[] = [
      {
        id: deliverableId,
        client_id: clientId,
        type: 'brief',
        title: 'Q4 Content Strategy',
        content_md: '# Strategy Overview',
        external_link: '',
        status: 'sent',
        created_by: null,
        updated_by: null,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
        sent_at: '2026-10-01T00:00:00Z',
        approved_at: null,
      },
    ]

    queryClient.setQueryData(deliverableKeys.byClient(clientId), initialDeliverables)

    vi.mocked(deliverableService.updateDeliverableStatus).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
              }),
            50
          )
        )
    )

    const { result } = renderHook(() => useUpdateDeliverableStatus(), { wrapper })

    result.current.mutate({
      clientId,
      deliverableId,
      status: 'approved',
    })

    // Immediate in-flight optimistic check
    await waitFor(() => {
      const optimisticDeliverables = queryClient.getQueryData<Deliverable[]>(deliverableKeys.byClient(clientId))
      expect(optimisticDeliverables?.[0].status).toBe('approved')
      expect(optimisticDeliverables?.[0].approved_at).toBeDefined()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('rolls back deliverable status if status update fails', async () => {
    const { queryClient, wrapper } = createTestWrapper()
    const clientId = 'client-1'
    const deliverableId = 'deliv-200'

    const initialDeliverables: Deliverable[] = [
      {
        id: deliverableId,
        client_id: clientId,
        type: 'content',
        title: 'October Social Reels',
        content_md: '# Reels Plan',
        external_link: '',
        status: 'sent',
        created_by: null,
        updated_by: null,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
        sent_at: '2026-10-01T00:00:00Z',
        approved_at: null,
      },
    ]

    queryClient.setQueryData(deliverableKeys.byClient(clientId), initialDeliverables)

    vi.mocked(deliverableService.updateDeliverableStatus).mockRejectedValue(new Error('Network disconnected'))

    const { result } = renderHook(() => useUpdateDeliverableStatus(), { wrapper })

    result.current.mutate({
      clientId,
      deliverableId,
      status: 'revision_requested',
      notes: 'Please change the hook',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Rollback check
    const rolledBack = queryClient.getQueryData<Deliverable[]>(deliverableKeys.byClient(clientId))
    expect(rolledBack?.[0].status).toBe('sent')
  })
})
