import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getAiProviders,
  createAiProvider,
  updateAiProvider,
  deleteAiProvider,
  setDefaultAiProvider,
  testAiProviderConnection,
} from "./service"
import type { CreateAiProviderInput, UpdateAiProviderInput } from "./types"

export const aiProviderKeys = {
  all: ["ai_providers"] as const,
  list: () => [...aiProviderKeys.all, "list"] as const,
  detail: (id: string) => [...aiProviderKeys.all, "detail", id] as const,
}

export function useAiProviders() {
  return useQuery({
    queryKey: aiProviderKeys.list(),
    queryFn: () => getAiProviders(),
  })
}

export function useCreateAiProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAiProviderInput) => createAiProvider(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiProviderKeys.all })
    },
  })
}

export function useUpdateAiProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAiProviderInput }) =>
      updateAiProvider(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiProviderKeys.all })
    },
  })
}

export function useDeleteAiProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteAiProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiProviderKeys.all })
    },
  })
}

export function useSetDefaultAiProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => setDefaultAiProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiProviderKeys.all })
    },
  })
}

export function useTestAiProvider() {
  return useMutation({
    mutationFn: (id: string) => testAiProviderConnection(id),
  })
}
