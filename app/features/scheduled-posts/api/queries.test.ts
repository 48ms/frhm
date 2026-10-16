import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import {
  useCreateScheduledPost,
  useUpdateScheduledPost,
  useDeleteScheduledPost,
  postKeys,
} from './queries'
import * as postService from './service'

vi.mock('./service', () => ({
  getScheduledPostsByClient: vi.fn(),
  getAllScheduledPosts: vi.fn(),
  createScheduledPost: vi.fn(),
  updateScheduledPost: vi.fn(),
  deleteScheduledPost: vi.fn(),
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

describe('Scheduled Posts Queries & Optimistic Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('optimistically adds a scheduled post and rolls back if insertion fails', async () => {
    const { queryClient, wrapper } = createTestWrapper()
    const clientId = 'client-taraju'

    queryClient.setQueryData(postKeys.list(clientId), [])

    vi.mocked(postService.createScheduledPost).mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Post creation failed')), 50)
        )
    )

    const { result } = renderHook(() => useCreateScheduledPost(), { wrapper })

    result.current.mutate({
      client_id: clientId,
      title: 'New Reel Announcement',
      content: 'Check out our new products!',
      platform: 'instagram',
      scheduled_at: '2026-10-20T10:00:00Z',
      status: 'draft',
    })

    // In-flight optimistic check
    await waitFor(() => {
      const optimisticPosts = queryClient.getQueryData<any[]>(postKeys.list(clientId))
      expect(optimisticPosts).toHaveLength(1)
      expect(optimisticPosts?.[0].title).toBe('New Reel Announcement')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Rollback check
    const rolledBackPosts = queryClient.getQueryData<any[]>(postKeys.list(clientId))
    expect(rolledBackPosts).toEqual([])
  })

  it('optimistically updates post and rolls back if update fails', async () => {
    const { queryClient, wrapper } = createTestWrapper()
    const clientId = 'client-taraju'
    const postId = 'post-10'

    const initialPosts = [
      {
        id: postId,
        client_id: clientId,
        title: 'Original Title',
        content: 'Original Content',
        platform: 'tiktok',
        scheduled_at: '2026-10-22T10:00:00Z',
        status: 'draft',
      },
    ]

    queryClient.setQueryData(postKeys.list(clientId), initialPosts)

    vi.mocked(postService.updateScheduledPost).mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Update failed')), 50)
        )
    )

    const { result } = renderHook(() => useUpdateScheduledPost(), { wrapper })

    result.current.mutate({
      id: postId,
      clientId,
      title: 'Updated Title',
    })

    // In-flight optimistic check
    await waitFor(() => {
      const optimisticPosts = queryClient.getQueryData<any[]>(postKeys.list(clientId))
      expect(optimisticPosts?.[0].title).toBe('Updated Title')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Rollback check
    const rolledBackPosts = queryClient.getQueryData<any[]>(postKeys.list(clientId))
    expect(rolledBackPosts?.[0].title).toBe('Original Title')
  })

  it('optimistically deletes post and rolls back if deletion fails', async () => {
    const { queryClient, wrapper } = createTestWrapper()
    const clientId = 'client-taraju'
    const postId = 'post-20'

    const initialPosts = [
      {
        id: postId,
        client_id: clientId,
        title: 'Post to delete',
        content: 'Bye bye',
        platform: 'instagram',
        scheduled_at: '2026-10-25T10:00:00Z',
        status: 'draft',
      },
    ]

    queryClient.setQueryData(postKeys.list(clientId), initialPosts)

    vi.mocked(postService.deleteScheduledPost).mockImplementation(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Delete rejected')), 50)
        )
    )

    const { result } = renderHook(() => useDeleteScheduledPost(), { wrapper })

    result.current.mutate({
      id: postId,
      clientId,
    })

    // In-flight optimistic check
    await waitFor(() => {
      const optimisticPosts = queryClient.getQueryData<any[]>(postKeys.list(clientId))
      expect(optimisticPosts).toHaveLength(0)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    // Rollback check
    const rolledBackPosts = queryClient.getQueryData<any[]>(postKeys.list(clientId))
    expect(rolledBackPosts).toEqual(initialPosts)
  })
})
