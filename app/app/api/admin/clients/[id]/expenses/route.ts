import { NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const clientId = (await params).id
  const { budget_id, amount, category, description, expense_date } = await req.json()

  if (amount === undefined || !expense_date) {
    return NextResponse.json({ error: 'amount dan expense_date wajib diisi' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      client_id: clientId,
      budget_id: budget_id || null,
      amount: Number(amount),
      category: category || null,
      description: description || null,
      expense_date: new Date(expense_date).toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ expense: data })
}