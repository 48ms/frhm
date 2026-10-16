import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateClient, deleteClient } from "./service"
import type { UpdateClientInput } from "./types"
import { socialKeys } from "@/features/social-accounts/api/queries"
import { dashboardKeys } from "@/features/dashboard/api/queries"
import type { ClientWithChannels } from "@/features/social-accounts/api/types"
import { toast } from "sonner"

export const clientKeys = {
  all: ["clients"] as const,
  detail: (id: string) => [...clientKeys.all, "detail", id] as const,
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateClientInput) => updateClient(input),
    onMutate: async (newClientData) => {
      await queryClient.cancelQueries({ queryKey: socialKeys.clients() })
      const previousClients = queryClient.getQueryData<ClientWithChannels[]>(socialKeys.clients())

      if (previousClients) {
        queryClient.setQueryData<ClientWithChannels[]>(
          socialKeys.clients(),
          previousClients.map((client) => {
            if (client.id !== newClientData.id) return client
            return {
              ...client,
              name: newClientData.name,
              contact_email: newClientData.contact_email || null,
              contact_phone: newClientData.contact_phone || null,
              brand_profile: {
                ...client.brand_profile,
                who: newClientData.name,
                ...(newClientData.niche ? { niche: newClientData.niche } : {}),
              },
              updated_at: new Date().toISOString(),
            }
          })
        )
      }

      return { previousClients }
    },
    onError: (err, _newClientData, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(socialKeys.clients(), context.previousClients)
      }
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui client.")
    },
    onSuccess: (data) => {
      toast.success(`Client "${data.name}" berhasil diperbarui.`)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: socialKeys.clients() })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.clients() })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (clientId: string) => deleteClient(clientId),
    onMutate: async (clientId) => {
      await queryClient.cancelQueries({ queryKey: socialKeys.clients() })
      const previousClients = queryClient.getQueryData<ClientWithChannels[]>(socialKeys.clients())

      if (previousClients) {
        queryClient.setQueryData<ClientWithChannels[]>(
          socialKeys.clients(),
          previousClients.filter((client) => client.id !== clientId)
        )
      }

      return { previousClients }
    },
    onError: (err, _clientId, context) => {
      if (context?.previousClients) {
        queryClient.setQueryData(socialKeys.clients(), context.previousClients)
      }
      toast.error(err instanceof Error ? err.message : "Gagal menghapus client.")
    },
    onSuccess: (res) => {
      toast.success(`Client "${res.name}" berhasil dihapus.`)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: socialKeys.clients() })
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.clients() })
    },
  })
}
