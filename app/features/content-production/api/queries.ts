import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { getContentProductions, createContentProduction, updateContentProduction, deleteContentProduction } from "./service"
import type { CreateContentProductionInput, UpdateContentProductionInput } from "./types"

export const contentProductionKeys = {
  all: ["content-productions"] as const,
  byClient: (clientId: string) => [...contentProductionKeys.all, "client", clientId] as const,
}

export const contentProductionQueries = {
  listByClient: (clientId: string) =>
    queryOptions({
      queryKey: contentProductionKeys.byClient(clientId),
      queryFn: () => getContentProductions(clientId),
      enabled: Boolean(clientId),
    }),
}

export function useCreateContentProduction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateContentProductionInput) => createContentProduction(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: contentProductionKeys.byClient(variables.client_id) })
    },
  })
}

export function useUpdateContentProduction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateContentProductionInput }) =>
      updateContentProduction(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: contentProductionKeys.all })
      const previousData = queryClient.getQueriesData<import("./types").ContentProduction[]>({
        queryKey: contentProductionKeys.all,
      })
      queryClient.setQueriesData<import("./types").ContentProduction[]>({ queryKey: contentProductionKeys.all }, (old) => {
        if (!old) return old
        return old.map((item) => (item.id === id ? { ...item, ...patch } : item))
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
        queryClient.invalidateQueries({ queryKey: contentProductionKeys.byClient(data.client_id) })
      } else {
        queryClient.invalidateQueries({ queryKey: contentProductionKeys.all })
      }
    },
  })
}

export function useDeleteContentProduction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteContentProduction(id),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: contentProductionKeys.all })
      const previousData = queryClient.getQueriesData<import("./types").ContentProduction[]>({
        queryKey: contentProductionKeys.all,
      })
      queryClient.setQueriesData<import("./types").ContentProduction[]>({ queryKey: contentProductionKeys.all }, (old) => {
        if (!old) return old
        return old.filter((item) => item.id !== id)
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
      queryClient.invalidateQueries({ queryKey: contentProductionKeys.all })
    },
  })
}
