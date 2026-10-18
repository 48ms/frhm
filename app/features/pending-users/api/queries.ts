import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchPendingUsers, approvePendingUser } from './service'
import type { ApproveUserInput } from './types'

export const pendingUsersKeys = {
  all: ['pending-users'] as const,
  list: () => [...pendingUsersKeys.all, 'list'] as const,
}

export const pendingUsersQueries = {
  list: () =>
    queryOptions({
      queryKey: pendingUsersKeys.list(),
      queryFn: () => fetchPendingUsers(),
      staleTime: 10_000,
      refetchInterval: 15_000,
    }),
}

export function usePendingUsers(options?: { enabled?: boolean }) {
  return useQuery({
    ...pendingUsersQueries.list(),
    enabled: options?.enabled ?? true,
  })
}

export function useApproveUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ApproveUserInput) => approvePendingUser(input),
    onSuccess: () => {
      // Invalidate pending users list
      queryClient.invalidateQueries({ queryKey: pendingUsersKeys.all })
      // Also invalidate clients list and other relevant queries
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}
