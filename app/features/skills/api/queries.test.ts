import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useUpdateClientSkillStatus, skillKeys } from './queries'
import * as skillService from './service'
import type { ClientSkill } from './types'

vi.mock('./service', () => ({
  getSkills: vi.fn(),
  getSkillPacks: vi.fn(),
  getSkillDetail: vi.fn(),
  getClientSkills: vi.fn(),
  assignPackToClient: vi.fn(),
  updateClientSkillStatus: vi.fn(),
  saveSkillOutput: vi.fn(),
  executeSkillChat: vi.fn(),
  getClientSkillOutputs: vi.fn(),
  executeSkillTool: vi.fn(),
  executeGenericSkill: vi.fn(),
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

describe('Skills Queries & Optimistic Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('optimistically updates client skill status and notes, then settles on success', async () => {
    const { queryClient, wrapper } = createTestWrapper()
    const clientId = 'client-taraju'
    const skillId = 'viral-generator-builder'

    const initialSkills: ClientSkill[] = [
      {
        id: 'cs-1',
        client_id: clientId,
        skill_id: skillId,
        status: 'belum',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
        notes: null,
      },
    ]

    queryClient.setQueryData(skillKeys.clientSkills(clientId), initialSkills)

    vi.mocked(skillService.updateClientSkillStatus).mockImplementation(
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

    const { result } = renderHook(() => useUpdateClientSkillStatus(), { wrapper })

    result.current.mutate({
      clientId,
      skillId,
      status: 'jalan',
      notes: 'Sedang riset format Reels',
    })

    // In-flight optimistic check
    await waitFor(() => {
      const optimisticSkills = queryClient.getQueryData<ClientSkill[]>(skillKeys.clientSkills(clientId))
      expect(optimisticSkills?.[0].status).toBe('jalan')
      expect(optimisticSkills?.[0].notes).toBe('Sedang riset format Reels')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('rolls back client skill status if server mutation fails', async () => {
    const { queryClient, wrapper } = createTestWrapper()
    const clientId = 'client-pawon'
    const skillId = 'copywriting-generator'

    const initialSkills: ClientSkill[] = [
      {
        id: 'cs-2',
        client_id: clientId,
        skill_id: skillId,
        status: 'jalan',
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
        notes: 'Draft 1 siap',
      },
    ]

    queryClient.setQueryData(skillKeys.clientSkills(clientId), initialSkills)

    vi.mocked(skillService.updateClientSkillStatus).mockRejectedValue(new Error('Permission denied'))

    const { result } = renderHook(() => useUpdateClientSkillStatus(), { wrapper })

    result.current.mutate({
      clientId,
      skillId,
      status: 'selesai',
      notes: 'Selesai approved',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Rollback check
    const rolledBackSkills = queryClient.getQueryData<ClientSkill[]>(skillKeys.clientSkills(clientId))
    expect(rolledBackSkills?.[0].status).toBe('jalan')
    expect(rolledBackSkills?.[0].notes).toBe('Draft 1 siap')
  })
})
