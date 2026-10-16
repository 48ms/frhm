import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  getClientsWithChannels, 
  connectDirectChannel,
  disconnectChannel, 
  syncChannel, 
  updateBrandProfile, 
  generateBrandProfile 
} from "./service"
import type { ClientWithChannels, ClientChannel, ConnectDirectChannelInput, GenerateBrandProfileInput, SocialPlatform } from "./types"

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

export function useConnectChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ConnectDirectChannelInput) => connectDirectChannel(input),
    onMutate: async (newChannel) => {
      // Optimistic Update (Aturan #16: Zero-Latency Feel)
      await queryClient.cancelQueries({ queryKey: socialKeys.clients() })
      const previousClients = queryClient.getQueryData<ClientWithChannels[]>(socialKeys.clients())

      if (previousClients) {
        const normalizedPlatform = newChannel.platform.toLowerCase() as SocialPlatform
        const formattedHandle = newChannel.handle.startsWith('@') ? newChannel.handle : `@${newChannel.handle}`
        
        queryClient.setQueryData<ClientWithChannels[]>(
          socialKeys.clients(),
          previousClients.map((client) => {
            if (client.id !== newChannel.clientId) return client
            const existingChannelIndex = client.channels.findIndex(
              (ch) => ch.platform.toLowerCase() === normalizedPlatform
            )
            const channelObj: ClientChannel = {
              id: existingChannelIndex >= 0 ? client.channels[existingChannelIndex].id : `temp-${Date.now()}`,
              client_id: newChannel.clientId,
              platform: normalizedPlatform,
              handle: formattedHandle,
              status: "terhubung",
              note: newChannel.note ?? null,
              avatar_url: newChannel.avatarUrl ?? null,
              confirmed_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }

            const updatedChannels = [...client.channels]
            if (existingChannelIndex >= 0) {
              updatedChannels[existingChannelIndex] = channelObj
            } else {
              updatedChannels.push(channelObj)
            }

            return {
              ...client,
              channels: updatedChannels,
            }
          })
        )
      }

      return { previousClients }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(socialKeys.clients(), context.previousClients)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: socialKeys.clients() })
    },
  })
}


export function useDisconnectChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: disconnectChannel,
    onMutate: async (channelId: string) => {
      // Optimistic Update (Aturan #16: Zero-Latency Feel)
      await queryClient.cancelQueries({ queryKey: socialKeys.clients() })
      const previousClients = queryClient.getQueryData<ClientWithChannels[]>(socialKeys.clients())

      if (previousClients) {
        queryClient.setQueryData<ClientWithChannels[]>(
          socialKeys.clients(),
          previousClients.map((client) => ({
            ...client,
            channels: client.channels.filter((ch) => ch.id !== channelId),
          }))
        )
      }

      return { previousClients }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(socialKeys.clients(), context.previousClients)
      }
    },
    onSettled: () => {
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
