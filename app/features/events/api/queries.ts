import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getEvents, createEvent } from "./service"
import { eventKeys } from "./keys"
import type { CreateEventInput } from "./types"

export const eventQueries = {
  listByClient: (clientId: string) =>
    queryOptions({
      queryKey: eventKeys.all(clientId),
      queryFn: () => getEvents(clientId),
      enabled: Boolean(clientId),
    }),
}

export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateEventInput) => createEvent(input),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Event berhasil dibuat!")
        void queryClient.invalidateQueries({ queryKey: ["events"] })
      } else {
        toast.error(res.error || "Gagal membuat event")
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    },
  })
}
