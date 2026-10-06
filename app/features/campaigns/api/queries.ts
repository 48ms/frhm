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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.byClient(data.client_id) })
    },
  })
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all })
    },
  })
}
