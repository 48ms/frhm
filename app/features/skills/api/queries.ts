'use client'

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getSkills,
  getSkillPacks,
  getSkillDetail,
  getClientSkills,
  assignPackToClient,
  updateClientSkillStatus,
  saveSkillOutput,
  executeSkillChat,
  getClientSkillOutputs,
  executeSkillTool,
} from "./service"
import type { SkillFilters, ClientSkillStatus, SaveSkillOutputInput, SkillChatTurn } from "./types"

/**
 * TanStack React Query v5 factories & hooks for Skills & Playbooks
 * 100% compliant with AGENTS.md
 */

export const skillKeys = {
  all: ["skills"] as const,
  list: (filters?: SkillFilters) => [...skillKeys.all, "list", filters] as const,
  packs: () => [...skillKeys.all, "packs"] as const,
  detail: (skillId: string) => [...skillKeys.all, "detail", skillId] as const,
  clientSkills: (clientId: string) => [...skillKeys.all, "client", clientId] as const,
  outputs: (clientId: string) => [...skillKeys.all, "outputs", clientId] as const,
}

/** Hook untuk mengambil daftar 106 skills */
export function useSkills(filters?: SkillFilters) {
  return useQuery({
    queryKey: skillKeys.list(filters),
    queryFn: () => getSkills(filters),
    staleTime: 1000 * 60 * 10, // 10 menit (katalog relatif statis)
  })
}

/** Hook untuk mengambil 17 topic packs */
export function useSkillPacks() {
  return useQuery({
    queryKey: skillKeys.packs(),
    queryFn: () => getSkillPacks(),
    staleTime: 1000 * 60 * 15,
  })
}

/** Hook untuk mengambil detail 1 skill + file playbooks */
export function useSkillDetail(skillId: string) {
  return useQuery({
    queryKey: skillKeys.detail(skillId),
    queryFn: () => getSkillDetail(skillId),
    enabled: Boolean(skillId),
  })
}

/** Hook untuk mengambil progres skill klien aktif */
export function useClientSkills(clientId: string) {
  return useQuery({
    queryKey: skillKeys.clientSkills(clientId),
    queryFn: () => getClientSkills(clientId),
    enabled: Boolean(clientId),
  })
}

/** Hook untuk mengambil seluruh dokumen output yang dihasilkan untuk klien */
export function useClientSkillOutputs(clientId: string) {
  return useQuery({
    queryKey: skillKeys.outputs(clientId),
    queryFn: () => getClientSkillOutputs(clientId),
    enabled: Boolean(clientId),
  })
}

/** Mutasi penugasan skill pack ke klien */
export function useAssignPackToClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ clientId, packId }: { clientId: string; packId: string }) =>
      assignPackToClient(clientId, packId),
    onSuccess: (res, vars) => {
      if (res.success) {
        toast.success(`Berhasil menugaskan ${res.count} skill ke klien`)
        queryClient.invalidateQueries({ queryKey: skillKeys.clientSkills(vars.clientId) })
      } else {
        toast.error(res.error || "Gagal menugaskan paket skill")
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Terjadi kesalahan")
    },
  })
}

/** Mutasi update status skill klien */
export function useUpdateClientSkillStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      clientId,
      skillId,
      status,
      notes,
    }: {
      clientId: string
      skillId: string
      status: ClientSkillStatus
      notes?: string
    }) => updateClientSkillStatus(clientId, skillId, status, notes),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: skillKeys.clientSkills(vars.clientId) })
    },
  })
}

/** Mutasi simpan hasil output skill */
export function useSaveSkillOutput() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SaveSkillOutputInput) => saveSkillOutput(input),
    onSuccess: (res, vars) => {
      if (res.success) {
        toast.success("Dokumen berhasil disimpan ke klien!")
        queryClient.invalidateQueries({ queryKey: skillKeys.clientSkills(vars.clientId) })
        queryClient.invalidateQueries({ queryKey: skillKeys.outputs(vars.clientId) })
      } else {
        toast.error(res.error || "Gagal menyimpan dokumen")
      }
    },
  })
}

/** Mutasi turn chat wawancara terpandu */
export function useSkillChatTurn() {
  return useMutation({
    mutationFn: (input: { clientId: string; skillId: string; messages: SkillChatTurn[] }) =>
      executeSkillChat(input),
  })
}

/** Mutasi eksekusi live MCP Tool untuk skill */
export function useExecuteSkillTool() {
  return useMutation({
    mutationFn: (input: { clientId: string; skillId: string; toolName: string; parameters?: Record<string, any> }) =>
      executeSkillTool(input),
  })
}

