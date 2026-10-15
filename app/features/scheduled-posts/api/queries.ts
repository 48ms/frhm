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
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: postKeys.list(input.client_id) })
      const previousPosts = queryClient.getQueryData(postKeys.list(input.client_id))
      const optimisticPost = {
        id: `temp-${Date.now()}`,
        client_id: input.client_id,
        title: input.title,
        content: input.content,
        platform: input.platform,
        scheduled_at: input.scheduled_at,
        status: input.status || "scheduled",
        created_at: new Date().toISOString(),
        author: input.author ?? null,
        media_url: input.media_url ?? null,
        is_reserved: input.is_reserved ?? false,
        reserved_for: input.reserved_for ?? null,
        campaign_tag: input.campaign_tag ?? null,
        priority: input.priority ?? "normal",
      }
      queryClient.setQueryData(postKeys.list(input.client_id), (old: any[] = []) => [
        ...(Array.isArray(old) ? old : []),
        optimisticPost,
      ])
      return { previousPosts, clientId: input.client_id }
    },
    onError: (_, __, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(postKeys.list(context.clientId), context.previousPosts)
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: postKeys.list(variables.client_id) })
    },
  })
}

/**
 * Bulk-create many scheduled posts in a single round-trip.
 * Replaces the N+1 sequential loop used by the AI Batch Planner.
 */
export function useCreateScheduledPostsBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (inputs: CreateScheduledPostInput[]) => createScheduledPost(inputs),
    onSuccess: (data, variables) => {
      const clientId = variables[0]?.client_id
      if (clientId) {
        queryClient.invalidateQueries({ queryKey: postKeys.list(clientId) })
      }
      queryClient.invalidateQueries({ queryKey: postKeys.all })
      return data
    },
  })
}

export function useUpdateScheduledPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, clientId, ...patch }: { id: string; clientId: string } & UpdateScheduledPostInput) =>
      updateScheduledPost({ id, clientId, ...patch }),
    onMutate: async ({ id, clientId, ...patch }) => {
      await queryClient.cancelQueries({ queryKey: postKeys.list(clientId) })
      const previousPosts = queryClient.getQueryData(postKeys.list(clientId))
      queryClient.setQueryData(postKeys.list(clientId), (old: any[]) => 
        Array.isArray(old) ? old.map((p) => (p.id === id ? { ...p, ...patch } : p)) : []
      )
      return { previousPosts, clientId }
    },
    onError: (_, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(postKeys.list(variables.clientId), context.previousPosts)
      }
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
