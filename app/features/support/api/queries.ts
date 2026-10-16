import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getSupportTicketsByClient, getAllSupportTickets, createSupportTicket, updateSupportTicket } from "./service"
import type { CreateSupportTicketInput, UpdateSupportTicketInput } from "./types"

export const supportTicketKeys = {
  all: ["support-tickets"] as const,
  byClient: (clientId: string) => [...supportTicketKeys.all, "client", clientId] as const,
}

export const supportTicketQueries = {
  /** Query untuk mendapatkan seluruh tiket dukungan milik satu klien. */
  listByClient: (clientId: string) =>
    queryOptions({
      queryKey: supportTicketKeys.byClient(clientId),
      queryFn: () => getSupportTicketsByClient(clientId),
      enabled: Boolean(clientId),
    }),

  /** Query untuk admin melihat seluruh tiket lintas klien */
  listAll: () =>
    queryOptions({
      queryKey: supportTicketKeys.all,
      queryFn: () => getAllSupportTickets(),
    }),
}

export function useAllSupportTickets() {
  return useQuery(supportTicketQueries.listAll())
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSupportTicketInput) => createSupportTicket(input),
    onSuccess: (_, variables) => {
      if (variables.clientId) {
        queryClient.invalidateQueries({ queryKey: supportTicketKeys.byClient(variables.clientId) })
      }
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.all })
    },
  })
}

export function useUpdateSupportTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: UpdateSupportTicketInput) => updateSupportTicket(input),
    onSuccess: (_, vars) => {
      toast.success("Status tiket berhasil diperbarui")
      if (vars.clientId) {
        queryClient.invalidateQueries({ queryKey: supportTicketKeys.byClient(vars.clientId) })
      }
      queryClient.invalidateQueries({ queryKey: supportTicketKeys.all })
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui tiket")
    },
  })
}
