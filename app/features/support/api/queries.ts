import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { getSupportTicketsByClient, createSupportTicket } from "./service"
import type { CreateSupportTicketInput } from "./types"

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
