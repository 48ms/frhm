'use server'

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import type { ClientBudget, Expense, AdSpendLog, KOL } from "./types"

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
