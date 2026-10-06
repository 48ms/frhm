import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  getScheduledPostsByClient,
  createScheduledPost,
  updateScheduledPost,
  deleteScheduledPost
} from "./service"
import type { CreateScheduledPostInput, UpdateScheduledPostInput } from "./types"

export const postKeys = {
  all: ["scheduled_posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  list: (clientId: string) => [...postKeys.lists(), { clientId }] as const,
}

/** Query options factory — dipakai untuk prefetch & useQuery non-hook. */
export const scheduledPostQueries = {
  listByClient: (clientId: string) => ({
    queryKey: postKeys.list(clientId),
    queryFn: () => getScheduledPostsByClient(clientId),
    enabled: Boolean(clientId),
  }),
}

export function useScheduledPosts(clientId: string) {
  return useQuery({
    queryKey: postKeys.list(clientId),
    queryFn: () => getScheduledPostsByClient(clientId),
    enabled: !!clientId,
  })
}

export function useCreateScheduledPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateScheduledPostInput) => createScheduledPost(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: postKeys.list(variables.client_id) })
    },
  })
}

export function useUpdateScheduledPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string } & UpdateScheduledPostInput) =>
      updateScheduledPost({ id, ...patch }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all })
    },
  })
}

export function useDeleteScheduledPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, clientId }: { id: string; clientId: string }) =>
      deleteScheduledPost(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: postKeys.list(variables.clientId) })
    },
  })
}
