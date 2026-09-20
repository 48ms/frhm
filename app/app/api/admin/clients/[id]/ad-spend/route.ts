import { NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const clientId = params.id
  const { campaign_name, spend, clicks, log_date } = await req.json()

  if (!campaign_name || log_date === undefined) {
    return NextResponse.json({ error: 'campaign_name dan log_date wajib diisi' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ad_spend_logs')
    .insert({
      client_id: clientId,
      campaign_name,
      spend: Number(spend) || 0,
      clicks: Number(clicks) || 0,
      log_date,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ad_spend_log: data })
}
