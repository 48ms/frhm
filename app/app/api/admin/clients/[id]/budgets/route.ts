import { NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'

export const dynamic = 'force-dynamic'

/**
 * Upsert a client's monthly budget.
 *
 * POST /api/admin/clients/[id]/budgets
 *   body: { month: 'YYYY-MM', total_budget: number }
 *
 * client_budgets has UNIQUE(client_id, month), so this is a true upsert.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const clientId = params.id
  const { month, total_budget } = await req.json()

  if (!month || total_budget === undefined) {
    return NextResponse.json({ error: 'month dan total_budget wajib diisi' }, { status: 400 })
  }

  const formattedMonth = `${month}-01` // YYYY-MM-01

  const { data, error } = await supabase
    .from('client_budgets')
    .upsert(
      {
        client_id: clientId,
        month: formattedMonth,
        total_budget: Number(total_budget),
        remaining_balance: Number(total_budget),
      },
      { onConflict: 'client_id,month' },
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ budget: data })
}
