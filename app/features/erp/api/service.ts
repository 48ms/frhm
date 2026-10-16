'use server'

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit/log"
import type { ClientBudget, Expense, AdSpendLog, KOL, CreateExpenseInput, AddAdSpendLogInput } from "./types"
/**
 * Service Layer for ERP financial & partner data.
 * Covers: client_budgets, expenses, ad_spend_logs (036), kols (036 + 046).
 * 100% Supabase Auth & PostgreSQL RLS.
 *
 * All read helpers degrade gracefully (return [] instead of throwing) so that
 * TanStack Query never rejects during render — see PROGRESS.md note on the
 * "Cannot update Router while rendering" warning.
 */

export async function getClientBudgets(clientId: string): Promise<ClientBudget[]> {
  if (!clientId) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("client_budgets")
    .select("id, client_id, month, total_budget, remaining_balance, created_at, updated_at")
    .eq("client_id", clientId)
    .order("month", { ascending: false })

  if (error) {
    logger.error("getClientBudgets failed", { error })
    return []
  }
  return (data ?? []) as ClientBudget[]
}

export async function getExpenses(clientId: string): Promise<Expense[]> {
  if (!clientId) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("expenses")
    .select("id, client_id, budget_id, amount, category, description, expense_date, created_at")
    .eq("client_id", clientId)
    .order("expense_date", { ascending: false })

  if (error) {
    logger.error("getExpenses failed", { error })
    return []
  }
  return (data ?? []) as Expense[]
}

export async function getAdSpendLogs(clientId: string): Promise<AdSpendLog[]> {
  if (!clientId) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("ad_spend_logs")
    .select("id, client_id, campaign_name, spend, clicks, log_date, created_at")
    .eq("client_id", clientId)
    .order("log_date", { ascending: false })

  if (error) {
    logger.error("getAdSpendLogs failed", { error })
    return []
  }
  return (data ?? []) as AdSpendLog[]
}

export async function getKOLs(clientId: string): Promise<KOL[]> {
  if (!clientId) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("kols")
    .select("id, client_id, name, niche, contact_info, rate_card, platforms, notes, created_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })

  if (error) {
    logger.error("getKOLs failed", { error })
    return []
  }
  return (data ?? []) as KOL[]
}

/**
 * Mencatat expense baru untuk client.
 * Setelah insert, `remaining_balance` pada `client_budgets` terkait juga
 * dikurangi (jika budget_id diberikan) agar angka di UI tetap konsisten
 * dengan total expenses yang ditampilkan.
 */
import { notifyBudgetThresholdAlert } from "@/lib/telegram/service"

export async function createExpense(
  input: CreateExpenseInput
): Promise<{ success: boolean; data?: Expense; error?: string; warning?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      client_id: input.client_id,
      budget_id: input.budget_id || null,
      amount: input.amount,
      category: input.category || null,
      description: input.description || null,
      expense_date: input.expense_date || new Date().toISOString(),
    })
    .select("*")
    .single()

  if (error) {
    logger.error("createExpense failed", { error })
    return { success: false, error: error.message }
  }

  let warning: string | undefined

  // Sinkronkan saldo budget terkait (read-modify-write, nilai faktual dari DB).
  if (input.budget_id) {
    const { data: budgetRow } = await supabase
      .from("client_budgets")
      .select("total_budget, remaining_balance")
      .eq("id", input.budget_id)
      .single()

    if (budgetRow && typeof budgetRow.remaining_balance === "number") {
      const nextBalance = Math.max(0, budgetRow.remaining_balance - input.amount)
      const { error: budgetErr } = await supabase
        .from("client_budgets")
        .update({ remaining_balance: nextBalance, updated_at: new Date().toISOString() })
        .eq("id", input.budget_id)

      if (budgetErr) {
        logger.warn("createExpense budget sync failed", { error: budgetErr.message })
      }

      const totalBudget = budgetRow.total_budget ?? 0
      const spent = totalBudget - nextBalance
      const spentPercentage = totalBudget > 0 ? (spent / totalBudget) * 100 : 0

      // Pemicu threshold alert jika realisasi anggaran >= 90% atau saldo habis
      if (spentPercentage >= 90 || nextBalance <= 0) {
        warning = spentPercentage >= 100
          ? "Peringatan: Pengeluaran ini telah menghabiskan 100% budget klien!"
          : "Peringatan: Pengeluaran ini telah mencapai 90% dari total alokasi budget klien."

        const { data: clientData } = await supabase
          .from("clients")
          .select("name")
          .eq("id", input.client_id)
          .maybeSingle()

        void notifyBudgetThresholdAlert({
          clientName: clientData?.name || "Client",
          clientId: input.client_id,
          totalBudget,
          remainingBalance: nextBalance,
          spentPercentage,
          expenseAmount: input.amount,
          category: input.category,
        }).catch((alertErr) => {
          logger.warn("Telegram budget threshold alert notification failed", { error: alertErr })
        })
      }
    }
  }

  void logAudit({
    action: "expense.create",
    entityType: "expense",
    entityId: data.id,
    summary: `Recorded expense ${data.amount} (${data.category ?? "uncategorized"})`,
  })

  return { success: true, data: data as Expense, warning }
}

/**
 * Mencatat log ad spend untuk campaign/client.
 */
export async function addAdSpendLog(input: AddAdSpendLogInput): Promise<{ success: boolean; data?: AdSpendLog; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("ad_spend_logs")
    .insert({
      client_id: input.client_id,
      campaign_name: input.campaign_name,
      spend: input.spend,
      clicks: input.clicks || 0,
      log_date: input.log_date || new Date().toISOString().slice(0, 10),
    })
    .select("*")
    .single()

  if (error) {
    logger.error("addAdSpendLog failed", { error })
    return { success: false, error: error.message }
  }

  void logAudit({
    action: "ads_spend.create",
    entityType: "ad_spend_log",
    entityId: data.id,
    summary: `Logged spend ${input.spend} for campaign ${input.campaign_name}`,
  })

  return { success: true, data: data as AdSpendLog }
}
