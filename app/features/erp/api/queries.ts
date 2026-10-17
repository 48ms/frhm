import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getClientBudgets,
  getExpenses,
  getAdSpendLogs,
  getKOLs,
  createExpense,
  addAdSpendLog,
  updateExpense,
  deleteExpense,
} from "./service"
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
  AddAdSpendLogInput,
  Expense,
  ClientBudget,
  AdSpendLog,
} from "./types"

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
 * Hook mutasi untuk mencatat expense baru dengan Optimistic Updates (Aturan #16).
 * Segera memperbarui daftar pengeluaran dan mengurangi alokasi budget lokal
 * dengan rollback jika koneksi terputus.
 */
export function useCreateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateExpenseInput) => createExpense(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: erpKeys.expenses(input.client_id) })
      await queryClient.cancelQueries({ queryKey: erpKeys.budgets(input.client_id) })

      const previousExpenses = queryClient.getQueryData<Expense[]>(erpKeys.expenses(input.client_id))
      const previousBudgets = queryClient.getQueryData<ClientBudget[]>(erpKeys.budgets(input.client_id))

      const optimisticExpense: Expense = {
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        client_id: input.client_id,
        budget_id: input.budget_id ?? null,
        amount: input.amount,
        category: input.category ?? null,
        description: input.description ?? null,
        expense_date: input.expense_date ?? new Date().toISOString(),
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<Expense[]>(erpKeys.expenses(input.client_id), (old = []) => [
        optimisticExpense,
        ...(Array.isArray(old) ? old : []),
      ])

      if (input.budget_id && previousBudgets) {
        queryClient.setQueryData<ClientBudget[]>(
          erpKeys.budgets(input.client_id),
          previousBudgets.map((b) =>
            b.id === input.budget_id
              ? { ...b, remaining_balance: b.remaining_balance - input.amount }
              : b
          )
        )
      }

      return { previousExpenses, previousBudgets, clientId: input.client_id }
    },
    onError: (err: unknown, _vars, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(erpKeys.expenses(context.clientId), context.previousExpenses)
      }
      if (context?.previousBudgets) {
        queryClient.setQueryData(erpKeys.budgets(context.clientId), context.previousBudgets)
      }
      toast.error(err instanceof Error ? err.message : "Gagal mencatat pengeluaran")
    },
    onSuccess: (res) => {
      if (res.success) {
        if (res.warning) {
          toast.warning(res.warning, {
            description: "Telegram alert telah dikirimkan ke tim admin.",
          })
        } else {
          toast.success("Pengeluaran berhasil dicatat!")
        }
      } else {
        toast.error(res.error || "Gagal mencatat pengeluaran")
      }
    },
    onSettled: (_data, _err, variables) => {
      void queryClient.invalidateQueries({ queryKey: erpKeys.expenses(variables.client_id) })
      void queryClient.invalidateQueries({ queryKey: erpKeys.budgets(variables.client_id) })
    },
  })
}

/**
 * Hook mutasi untuk mencatat log ad spend dengan Optimistic Updates.
 */
export function useAddAdSpendLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AddAdSpendLogInput) => addAdSpendLog(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: erpKeys.adSpend(input.client_id) })
      const previousLogs = queryClient.getQueryData<AdSpendLog[]>(erpKeys.adSpend(input.client_id))

      const optimisticLog: AdSpendLog = {
        id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        client_id: input.client_id,
        campaign_name: input.campaign_name,
        spend: input.spend,
        clicks: input.clicks ?? 0,
        log_date: input.log_date ?? new Date().toISOString().slice(0, 10),
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<AdSpendLog[]>(erpKeys.adSpend(input.client_id), (old = []) => [
        optimisticLog,
        ...(Array.isArray(old) ? old : []),
      ])

      return { previousLogs, clientId: input.client_id }
    },
    onError: (err: unknown, _vars, context) => {
      if (context?.previousLogs) {
        queryClient.setQueryData(erpKeys.adSpend(context.clientId), context.previousLogs)
      }
      toast.error(err instanceof Error ? err.message : "Gagal mencatat log ad spend")
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Log ad spend berhasil dicatat!")
      } else {
        toast.error(res.error || "Gagal mencatat ad spend")
      }
    },
    onSettled: (_data, _err, variables) => {
      void queryClient.invalidateQueries({ queryKey: erpKeys.adSpend(variables.client_id) })
    },
  })
}

export function useUpdateExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateExpenseInput) => updateExpense(input),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Catatan expense berhasil diperbarui!")
      } else {
        toast.error(res.error || "Gagal memperbarui expense")
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: erpKeys.all })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("Catatan expense berhasil dihapus.")
      } else {
        toast.error(res.error || "Gagal menghapus expense")
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus")
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: erpKeys.all })
    },
  })
}
