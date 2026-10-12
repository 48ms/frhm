import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign } from "./service"
import type { CreateCampaignInput, UpdateCampaignInput } from "./types"

export const campaignKeys = {
  all: ["campaigns"] as const,
  byClient: (clientId: string) => [...campaignKeys.all, "client", clientId] as const,
}

export const campaignQueries = {
  /** Query untuk mendapatkan seluruh campaign milik satu klien. */
  listByClient: (clientId: string) =>
    queryOptions({
      queryKey: campaignKeys.byClient(clientId),
      queryFn: () => getCampaigns(clientId),
      enabled: Boolean(clientId),
    }),
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCampaignInput) => createCampaign(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.byClient(variables.client_id) })
    },
  })
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateCampaignInput }) =>
      updateCampaign(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: campaignKeys.all })
      const previousData = queryClient.getQueriesData<import("./types").Campaign[]>({ queryKey: campaignKeys.all })
      queryClient.setQueriesData<import("./types").Campaign[]>({ queryKey: campaignKeys.all }, (old) => {
        if (!old) return old
        return old.map((c) => (c.id === id ? { ...c, ...patch } : c))
      })
      return { previousData }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: (data) => {
      if (data?.client_id) {
        queryClient.invalidateQueries({ queryKey: campaignKeys.byClient(data.client_id) })
      } else {
        queryClient.invalidateQueries({ queryKey: campaignKeys.all })
      }
    },
  })
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteCampaign(id),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: campaignKeys.all })
      const previousData = queryClient.getQueriesData<import("./types").Campaign[]>({ queryKey: campaignKeys.all })
      queryClient.setQueriesData<import("./types").Campaign[]>({ queryKey: campaignKeys.all }, (old) => {
        if (!old) return old
        return old.filter((c) => c.id !== id)
      })
      return { previousData }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all })
    },
  })
}
