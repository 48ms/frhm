import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { getClientsWithChannels, disconnectChannel, syncChannel, updateBrandProfile, generateBrandProfile } from "./service"
import type { GenerateBrandProfileInput } from "./types"

export const socialKeys = {
  all: ["social-channels"] as const,
  clients: () => [...socialKeys.all, "clients"] as const,
}

export const socialQueries = {
  /** Query untuk mendapatkan seluruh klien dan channel sosialnya (Server Prefetch & Client Suspense) */
  listClientsWithChannels: () =>
    queryOptions({
      queryKey: socialKeys.clients(),
      queryFn: () => getClientsWithChannels(),
    }),
}

export function useDisconnectChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: disconnectChannel,
    onSuccess: () => {
      // Invalidate queries untuk me-refresh data
      queryClient.invalidateQueries({ queryKey: socialKeys.clients() })
    },
  })
}

export function useSyncChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: syncChannel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.clients() })
    },
  })
}

export function useUpdateBrandProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ clientId, profile }: { clientId: string; profile: any }) =>
      updateBrandProfile(clientId, profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.clients() })
    },
  })
}

export function useGenerateBrandProfile() {
  return useMutation({
    mutationFn: (input: GenerateBrandProfileInput) => generateBrandProfile(input),
  })
}
