import { queryOptions } from "@tanstack/react-query"
import { getClientBudgets, getExpenses, getAdSpendLogs, getKOLs } from "./service"

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
