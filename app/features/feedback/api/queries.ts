import { queryOptions, mutationOptions } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query-client'
import { fetchClientFeedback, createClientFeedback } from './service'
import type { CreateFeedbackPayload } from './types'

export const feedbackKeys = {
  all: ['feedback'] as const,
  lists: () => [...feedbackKeys.all, 'list'] as const,
  list: (clientId: string) => [...feedbackKeys.lists(), clientId] as const,
}

export function clientFeedbackQueryOptions(clientId: string) {
  return queryOptions({
    queryKey: feedbackKeys.list(clientId),
    queryFn: () => fetchClientFeedback(clientId),
    enabled: !!clientId,
    staleTime: 60 * 1000,
  })
}

export const createFeedbackMutation = mutationOptions({
  mutationFn: ({ clientId, payload }: { clientId: string; payload: CreateFeedbackPayload }) =>
    createClientFeedback(clientId, payload),
})

export function invalidateFeedbackQueries(clientId: string) {
  getQueryClient().invalidateQueries({ queryKey: feedbackKeys.list(clientId) })
}
