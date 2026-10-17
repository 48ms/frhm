import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
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
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: campaignKeys.byClient(input.client_id) })
      const previousData = queryClient.getQueryData<import("./types").Campaign[]>(
        campaignKeys.byClient(input.client_id)
      )
      const optimisticCampaign: import("./types").Campaign = {
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        client_id: input.client_id,
        name: input.name,
        type: input.type,
        start_date: input.start_date ?? null,
        end_date: input.end_date ?? null,
        color: input.color ?? null,
        notes: input.notes ?? null,
        created_at: new Date().toISOString(),
      }
      queryClient.setQueryData<import("./types").Campaign[]>(
        campaignKeys.byClient(input.client_id),
        (old = []) => [optimisticCampaign, ...(Array.isArray(old) ? old : [])]
      )
      return { previousData, clientId: input.client_id }
    },
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(campaignKeys.byClient(context.clientId), context.previousData)
      }
      toast.error(err instanceof Error ? err.message : "Gagal membuat kampanye")
    },
    onSuccess: (res) => {
      toast.success("Kampanye berhasil dibuat!", {
        description: `Kampanye "${res.name}" berhasil ditambahkan.`,
      })
    },
    onSettled: (_data, _err, variables) => {
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
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui kampanye")
    },
    onSuccess: (res) => {
      toast.success("Kampanye berhasil diperbarui!", {
        description: `Perubahan pada "${res.name}" disimpan.`,
      })
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
    onError: (err, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error(err instanceof Error ? err.message : "Gagal menghapus kampanye")
    },
    onSuccess: () => {
      toast.success("Kampanye berhasil dihapus.")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all })
    },
  })
}
