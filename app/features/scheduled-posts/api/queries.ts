import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  getScheduledPostsByClient,
  getAllScheduledPosts,
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
  listAll: () => ({
    queryKey: postKeys.lists(),
    queryFn: () => getAllScheduledPosts(),
  }),
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
    mutationFn: ({ id, clientId, ...patch }: { id: string; clientId: string } & UpdateScheduledPostInput) =>
      updateScheduledPost({ id, clientId, ...patch }),
    onMutate: async ({ id, clientId }) => {
      await queryClient.cancelQueries({ queryKey: postKeys.list(clientId) })
      const previousPosts = queryClient.getQueryData(postKeys.list(clientId))
      queryClient.setQueryData(postKeys.list(clientId), (old: any[]) => 
        old?.filter((p) => p.id !== id)
      )
      return { previousPosts }
    },
    onError: (_, variables, context) => {
      queryClient.setQueryData(postKeys.list(variables.clientId), context?.previousPosts)
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: postKeys.list(variables.clientId) })
    },
  })
}

export function useDeleteScheduledPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, clientId }: { id: string; clientId: string }) =>
      deleteScheduledPost(id, clientId),
    onMutate: async ({ id, clientId }) => {
      await queryClient.cancelQueries({ queryKey: postKeys.list(clientId) })
      const previousPosts = queryClient.getQueryData(postKeys.list(clientId))
      queryClient.setQueryData(postKeys.list(clientId), (old: any[]) => 
        old?.filter((p) => p.id !== id)
      )
      return { previousPosts }
    },
    onError: (_, variables, context) => {
      queryClient.setQueryData(postKeys.list(variables.clientId), context?.previousPosts)
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: postKeys.list(variables.clientId) })
    },
  })
}
