export type ClientBudget = {
  id: string
  client_id: string
  /** Month the budget applies to (DATE, first day of month). */
  month: string
  total_budget: number
  remaining_balance: number
  created_at: string | null
  updated_at: string | null
}

export type Expense = {
  id: string
  client_id: string
  budget_id: string | null
  amount: number
  category: string | null
  description: string | null
  expense_date: string | null
  created_at: string | null
}

export type AdSpendLog = {
  id: string
  client_id: string
  campaign_name: string
  spend: number
  clicks: number
  log_date: string
  created_at: string | null
}

export type KOL = {
  id: string
  client_id: string
  name: string
  niche: string | null
  contact_info: string | null
  rate_card: number | null
  platforms: string[]
  notes: string | null
  created_at: string | null
}
