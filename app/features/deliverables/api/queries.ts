import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getDeliverablesByClient,
  getDeliverableById,
  promoteSkillOutputToDeliverable,
  updateDeliverableStatus,
  submitDeliverableReview,
  scheduleApprovedDeliverable,
} from "./service"
import type {
  PromoteSkillOutputInput,
  UpdateDeliverableStatusInput,
  SubmitDeliverableReviewInput,
  ScheduleDeliverableInput,
} from "./schema"
import { skillKeys } from "@/features/skills/api/queries"
import { postKeys } from "@/features/scheduled-posts/api/queries"

export const deliverableKeys = {
  all: ["deliverables"] as const,
  byClient: (clientId: string) => [...deliverableKeys.all, "client", clientId] as const,
  detail: (id: string) => [...deliverableKeys.all, "detail", id] as const,
}

export const deliverableQueries = {
  /** Query untuk mendapatkan seluruh deliverable milik satu klien. */
  listByClient: (clientId: string) =>
    queryOptions({
      queryKey: deliverableKeys.byClient(clientId),
      queryFn: () => getDeliverablesByClient(clientId),
      enabled: Boolean(clientId),
    }),

  /** Query untuk mendapatkan detail deliverable beserta client, comments, dan feedback */
  detail: (id: string) =>
    queryOptions({
      queryKey: deliverableKeys.detail(id),
      queryFn: () => getDeliverableById(id),
      enabled: Boolean(id),
    }),
}

export function useDeliverables(clientId: string) {
  return useQuery(deliverableQueries.listByClient(clientId))
}

export function useDeliverableDetail(id: string) {
  return useQuery(deliverableQueries.detail(id))
}

export function usePromoteSkillOutputToDeliverable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: PromoteSkillOutputInput) => promoteSkillOutputToDeliverable(input),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Dokumen Berhasil Dikirim ke Client!", {
          description: `Deliverable "${res.deliverable?.title}" siap ditinjau klien.`,
        })
        queryClient.invalidateQueries({ queryKey: deliverableKeys.all })
        queryClient.invalidateQueries({ queryKey: skillKeys.all })
      } else {
        toast.error("Gagal mengirim dokumen ke client", {
          description: res.error,
        })
      }
    },
    onError: (err: any) => {
      toast.error("Gagal mengirim ke client", {
        description: err.message,
      })
    },
  })
}

export function useUpdateDeliverableStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateDeliverableStatusInput) => updateDeliverableStatus(input),
    onSuccess: (res, vars) => {
      if (res.success) {
        const actionLabel =
          vars.status === "approved"
            ? "Deliverable telah disetujui (Approved)!"
            : vars.status === "revision_requested"
            ? "Permintaan revisi berhasil dicatat."
            : "Status deliverable diperbarui."

        toast.success(actionLabel)
        queryClient.invalidateQueries({ queryKey: deliverableKeys.all })
        queryClient.invalidateQueries({ queryKey: skillKeys.all })
      } else {
        toast.error("Gagal mengubah status", {
          description: res.error,
        })
      }
    },
    onError: (err: any) => {
      toast.error("Gagal mengubah status", {
        description: err.message,
      })
    },
  })
}

export function useSubmitDeliverableReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SubmitDeliverableReviewInput) => submitDeliverableReview(input),
    onSuccess: (res, vars) => {
      if (res.success) {
        const actionLabel =
          vars.status === "approved"
            ? "Deliverable berhasil disetujui! Terima kasih atas persetujuannya."
            : "Permintaan revisi telah berhasil disampaikan ke tim Frhm."

        toast.success(actionLabel)
        queryClient.invalidateQueries({ queryKey: deliverableKeys.all })
        queryClient.invalidateQueries({ queryKey: deliverableKeys.detail(vars.deliverableId) })
        queryClient.invalidateQueries({ queryKey: skillKeys.all })
      } else {
        toast.error("Gagal mengirim ulasan", {
          description: res.error,
        })
      }
    },
    onError: (err: any) => {
      toast.error("Gagal mengirim ulasan", {
        description: err.message,
      })
    },
  })
}

export function useScheduleApprovedDeliverable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ScheduleDeliverableInput) => scheduleApprovedDeliverable(input),
    onSuccess: (res, vars) => {
      if (res.success) {
        toast.success("Postingan Berhasil Dijadwalkan!", {
          description: `Konten siap dipublish otomatis ke ${vars.platform.toUpperCase()} pada ${new Date(
            vars.scheduledAt
          ).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}.`,
        })
        queryClient.invalidateQueries({ queryKey: deliverableKeys.all })
        queryClient.invalidateQueries({ queryKey: deliverableKeys.detail(vars.deliverableId) })
        queryClient.invalidateQueries({ queryKey: postKeys.all })
      } else {
        toast.error("Gagal menjadwalkan postingan", {
          description: res.error,
        })
      }
    },
    onError: (err: any) => {
      toast.error("Gagal menjadwalkan postingan", {
        description: err.message,
      })
    },
  })
}


