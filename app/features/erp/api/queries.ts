import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { getClientBudgets, getExpenses, getAdSpendLogs, getKOLs, createExpense, addAdSpendLog } from "./service"
import type { CreateExpenseInput, AddAdSpendLogInput } from "./types"

export const erpKeys = {
  all: ["erp"] as const,
  budgets: (clientId: string) => [...erpKeys.all, "budgets", clientId] as const,
  expenses: (clientId: string) => [...erpKeys.all, "expenses", clientId] as const,
  adSpend: (clientId: string) => [...erpKeys.all, "ad-spend", clientId] as const,
  kols: (clientId: string) => [...erpKeys.all, "kols", clientId] as const,
}

export const erpQueries = {
  /** Monthly budget allocations for a client. */
  listBudgetsByClient: (clientId: string) =>
    queryOptions({
      queryKey: erpKeys.budgets(clientId),
      queryFn: () => getClientBudgets(clientId),
      enabled: Boolean(clientId),
    }),

  /** Recorded expenses for a client. */
  listExpensesByClient: (clientId: string) =>
    queryOptions({
      queryKey: erpKeys.expenses(clientId),
      queryFn: () => getExpenses(clientId),
      enabled: Boolean(clientId),
    }),

  /** Ad spend logs (per campaign) for a client. */
  listAdSpendByClient: (clientId: string) =>
    queryOptions({
      queryKey: erpKeys.adSpend(clientId),
      queryFn: () => getAdSpendLogs(clientId),
      enabled: Boolean(clientId),
    }),

  /** Key Opinion Leaders / talent roster for a client. */
  listKOLsByClient: (clientId: string) =>
    queryOptions({
      queryKey: erpKeys.kols(clientId),
      queryFn: () => getKOLs(clientId),
      enabled: Boolean(clientId),
    }),
}

/** Hook mutasi untuk mengirim pesan uji coba Telegram */
export function useSendTelegramTest() {
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Gagal mengirim notifikasi Telegram.")
      }
      return data as { success: boolean; chatId: string; message: string }
    },
  })
}

/**
 * Hook mutasi untuk mencatat expense baru.
 * Menginvalidasi cache `erp` (expenses + budgets) agar breakdown budget di
 * campaigns-board langsung menampilkan angka faktual terbaru.
 */
export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateExpenseInput) => createExpense(input),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Pengeluaran berhasil dicatat!")
        void queryClient.invalidateQueries({ queryKey: erpKeys.all })
      } else {
        toast.error(res.error || "Gagal mencatat pengeluaran")
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    },
  })
}

/**
 * Hook mutasi untuk mencatat log ad spend.
 */
export function useAddAdSpendLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AddAdSpendLogInput) => addAdSpendLog(input),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Log ad spend berhasil dicatat!")
        void queryClient.invalidateQueries({ queryKey: erpKeys.all })
      } else {
        toast.error(res.error || "Gagal mencatat ad spend")
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    },
  })
}
