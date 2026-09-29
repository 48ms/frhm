import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return denyForbidden({ userId: user.id, role: profile?.role })

  // Ambil semua klien aktif riil
  const { data: clients, error: clientErr } = await supabase
    .from('clients')
    .select('id, name')
    .not('name', 'ilike', 'Test%')
    .not('name', 'ilike', 'probe%')
    .order('name')

  if (clientErr) return NextResponse.json({ error: clientErr.message }, { status: 500 })
  if (!clients || clients.length === 0) return NextResponse.json({ benchmarks: [] })

  // Ambil ringkasan analytics per klien
  const { data: summaries } = await supabase
    .from('analytics_summaries')
    .select('client_id, total_reach, total_engagement, total_wa_inquiries, total_dm_inquiries')

  // Ambil post_metrics live sebagai fallback/ground-truth
  const { data: liveMetrics } = await supabase
    .from('post_metrics')
    .select('client_id, reach, likes, comments, shares, saves, wa_inquiries, dm_inquiries')

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

  // Jika summary belum digenerate untuk client tertentu, gunakan liveMetrics
  for (const lm of liveMetrics || []) {
    if (!statsMap[lm.client_id] || statsMap[lm.client_id].reach === 0) {
      if (!statsMap[lm.client_id]) {
        statsMap[lm.client_id] = { reach: 0, engagement: 0, wa: 0, dm: 0, count: 0 }
      }
      statsMap[lm.client_id].reach += Number(lm.reach) || 0
      statsMap[lm.client_id].engagement += (Number(lm.likes) || 0) + (Number(lm.comments) || 0) + (Number(lm.shares) || 0) + (Number(lm.saves) || 0)
      statsMap[lm.client_id].wa += Number(lm.wa_inquiries) || 0
      statsMap[lm.client_id].dm += Number(lm.dm_inquiries) || 0
      statsMap[lm.client_id].count += 1
    }
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
