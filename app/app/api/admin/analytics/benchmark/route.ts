import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Ambil semua klien aktif
  const { data: clients, error: clientErr } = await supabase
    .from('clients')
    .select('id, name')
    .order('name')

  if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 })
  if (!clients || clients.length === 0) return NextResponse.json({ benchmarks: [] })

  // Ambil ringkasan analytics per klien
  const { data: summaries, error: sumErr } = await supabase
    .from('analytics_summaries')
    .select('client_id, total_reach, total_engagement, total_wa_inquiries, total_dm_inquiries')

  if (sumErr) return NextResponse.json({ error: sumErr.message }, { status: 500 })

  // Agregasi statistik per klien
  const statsMap: Record<string, { reach: number; engagement: number; wa: number; dm: number; count: number }> = {}

  for (const s of summaries || []) {
    if (!statsMap[s.client_id]) {
      statsMap[s.client_id] = { reach: 0, engagement: 0, wa: 0, dm: 0, count: 0 }
    }
    statsMap[s.client_id].reach += s.total_reach || 0
    statsMap[s.client_id].engagement += s.total_engagement || 0
    statsMap[s.client_id].wa += s.total_wa_inquiries || 0
    statsMap[s.client_id].dm += s.total_dm_inquiries || 0
    statsMap[s.client_id].count += 1
  }

  const benchmarks = clients.map(client => {
    const stat = statsMap[client.id] || { reach: 0, engagement: 0, wa: 0, dm: 0, count: 0 }
    const totalInquiries = stat.wa + stat.dm
    const er = stat.reach > 0 ? (stat.engagement / stat.reach) * 100 : 0
    const conversionRate = stat.reach > 0 ? (totalInquiries / stat.reach) * 100 : 0

    return {
      clientId: client.id,
      clientName: client.name,
      totalReach: stat.reach,
      avgReach: stat.count > 0 ? Math.round(stat.reach / stat.count) : 0,
      totalEngagement: stat.engagement,
      engagementRate: Number(er.toFixed(2)),
      totalWaInquiries: stat.wa,
      totalDmInquiries: stat.dm,
      totalInquiries,
      conversionRate: Number(conversionRate.toFixed(2)),
      summaryCount: stat.count,
    }
  })

  return NextResponse.json({ benchmarks })
}
