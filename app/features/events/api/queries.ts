import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getEvents, createEvent, updateEvent, deleteEvent } from "./service"
import { eventKeys } from "./keys"
import type { CreateEventInput, UpdateEventInput } from "./types"

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

export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateEventInput) => updateEvent(input),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Event berhasil diperbarui!")
        void queryClient.invalidateQueries({ queryKey: ["events"] })
      } else {
        toast.error(res.error || "Gagal memperbarui event")
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Event berhasil dihapus!")
        void queryClient.invalidateQueries({ queryKey: ["events"] })
      } else {
        toast.error(res.error || "Gagal menghapus event")
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    },
  })
}
