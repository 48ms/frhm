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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contentProductionKeys.byClient(data.client_id) })
    },
  })
}

export function useDeleteContentProduction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteContentProduction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentProductionKeys.all })
    },
  })
}
