'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { BudgetFormModal } from './budget-form-modal'
import { ExpenseFormModal } from './expense-form-modal'
import type { RealtimeChannel } from '@/lib/supabase/client'

type ClientBudget = {
  id: string
  month: string
  total_budget: number
  remaining_balance: number
}

type Expense = {
  id: string
  amount: number
  category: string
  description: string
  expense_date: string
}

export function BudgetLedgerBoard({ clientId }: { clientId: string }) {
  const [budget, setBudget] = useState<ClientBudget | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const handleBudgetSuccess = (newBudget: ClientBudget) => {
    setBudget(newBudget)
  }

  const handleExpenseSuccess = (newExpense: Expense) => {
    setExpenses([newExpense, ...expenses])
    if (budget) {
      setBudget({ ...budget, remaining_balance: budget.remaining_balance - newExpense.amount })
    }
  }

  useEffect(() => {
    async function fetchData() {
      const { data: bData } = await supabase
        .from('client_budgets')
        .select('*')
        .eq('client_id', clientId)
        .order('month', { ascending: false })
        .limit(1)

      if (bData && bData.length > 0) {
        setBudget(bData[0])
        const { data: eData } = await supabase
          .from('expenses')
          .select('*')
          .eq('client_id', clientId)
          .eq('budget_id', bData[0].id)
          .order('expense_date', { ascending: false })
        if (eData) setExpenses(eData)
      }
      setLoading(false)
    }
    fetchData()

    channelRef.current = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        (payload) => {
          const exp = payload.new as Expense & { client_id: string }
          if (exp.client_id === clientId) {
            handleExpenseSuccess(exp)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channelRef.current!)
    }
  }, [clientId, supabase])

  // Form submit handlers have been moved to their respective modals

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Monthly Budget</CardTitle>
            <CardDescription>Atur total budget klien per bulan</CardDescription>
          </div>
          <BudgetFormModal clientId={clientId} onSuccess={handleBudgetSuccess}>
            <Button size="sm" className="h-9">
              <Icons.billing className="size-4 mr-2" /> Set Budget
            </Button>
          </BudgetFormModal>
        </CardHeader>
        <CardContent>

          {budget && (
            <div className="p-4 rounded-md bg-muted/50 border">
              <div className="text-sm text-muted-foreground">Sisa Saldo ({budget.month})</div>
              <div className={`text-2xl font-bold ${budget.remaining_balance < budget.total_budget * 0.1 ? 'text-destructive' : 'text-primary'}`}>
                IDR {budget.remaining_balance.toLocaleString('id-ID')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Dari total IDR {budget.total_budget.toLocaleString('id-ID')}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Catat Pengeluaran</CardTitle>
            <CardDescription>Log pengeluaran Ads, KOL, atau Event</CardDescription>
          </div>
          <ExpenseFormModal clientId={clientId} budgetId={budget?.id} onSuccess={handleExpenseSuccess}>
            <Button size="sm" className="h-9" disabled={!budget}>
              <Icons.add className="size-4 mr-2" /> Catat Pengeluaran
            </Button>
          </ExpenseFormModal>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Riwayat Pengeluaran</h4>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : expenses.length === 0 ? (
              <div className="text-sm text-muted-foreground">Belum ada pengeluaran dicatat.</div>
            ) : (
              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                {expenses.map(e => (
                  <div key={e.id} className="flex justify-between items-center p-2 rounded border bg-card text-sm">
                    <div>
                      <div className="font-medium capitalize">{e.category}</div>
                      <div className="text-xs text-muted-foreground">{e.description} • {new Date(e.expense_date).toLocaleDateString('id-ID')}</div>
                    </div>
                    <div className="font-semibold text-destructive">
                      -IDR {e.amount.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
