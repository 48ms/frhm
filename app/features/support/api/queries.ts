import { queryOptions } from "@tanstack/react-query"
import { getSupportTicketsByClient } from "./service"

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
