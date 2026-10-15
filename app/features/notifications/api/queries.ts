import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getNotificationTargetForDeliverable,
  dispatchReviewNotification,
  testNotificationDispatch,
} from "./service"
import type {
  DispatchReviewNotificationInput,
  TestNotificationInput,
} from "./types"
import { deliverableKeys } from "@/features/deliverables/api/queries"

/**
 * AGENTS.md Rule 2 & 3: Service Layer 3-Lapis (queries.ts) & TanStack React Query v5
 */

export const notificationKeys = {
  all: ["notifications"] as const,
  target: (deliverableId: string) => [...notificationKeys.all, "target", deliverableId] as const,
}

export const notificationQueries = {
  target: (deliverableId: string) =>
    queryOptions({
      queryKey: notificationKeys.target(deliverableId),
      queryFn: () => getNotificationTargetForDeliverable(deliverableId),
      enabled: !!deliverableId,
      staleTime: 1000 * 30, // 30 detik
    }),
}

export function useNotificationTarget(deliverableId: string) {
  return useQuery(notificationQueries.target(deliverableId))
}

export function useDispatchReviewNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: DispatchReviewNotificationInput) =>
      dispatchReviewNotification(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: deliverableKeys.all })
      queryClient.invalidateQueries({ queryKey: notificationKeys.target(data.deliverableId) })
    },
  })
}

export function useTestNotificationDispatch() {
  return useMutation({
    mutationFn: (input: TestNotificationInput) =>
      testNotificationDispatch(input),
  })
}
