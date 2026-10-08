import { queryOptions } from "@tanstack/react-query"
import { getDeliverablesByClient } from "./service"

export const deliverableKeys = {
  all: ["deliverables"] as const,
  byClient: (clientId: string) => [...deliverableKeys.all, "client", clientId] as const,
}

export const deliverableQueries = {
  /** Query untuk mendapatkan seluruh deliverable milik satu klien. */
  listByClient: (clientId: string) =>
    queryOptions({
      queryKey: deliverableKeys.byClient(clientId),
      queryFn: () => getDeliverablesByClient(clientId),
      enabled: Boolean(clientId),
    }),
}
