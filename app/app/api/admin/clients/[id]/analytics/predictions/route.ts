import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

const PredictionInputSchema = z.object({
  target_month: z.string().regex(/^\d{4}-\d{2}-01$/),
  forecasted_reach: z.number().int().min(0),
  forecasted_er: z.number().min(0).max(100),
  forecasted_wa_inquiries: z.number().int().min(0),
  forecasted_dm_inquiries: z.number().int().min(0),
  estimated_roi_multiplier: z.number().min(0),
  confidence_score: z.number().min(0).max(1),
  model_notes: z.string().optional().nullable(),
})

// GET /api/admin/clients/[id]/analytics/predictions
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  // 1. Cek apakah ada record manual/terakhir di database
  const { data: savedPrediction } = await supabase
    .from('analytics_predictions')
    .select('*')
    .eq('client_id', clientId)
    .order('target_month', { ascending: false })
    .limit(1)
    .maybeSingle()

  // 2. Hitung algoritma baseline proyeksi otomatis dari performa 30 hari terakhir
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: posts } = await supabase
    .from('scheduled_posts')
    .select(`
      id, scheduled_at,
      post_metrics ( views, reach, likes, comments, shares, saves, clicks, wa_inquiries, dm_inquiries )
    `)
    .eq('client_id', clientId)
    .eq('status', 'published')
    .gte('scheduled_at', thirtyDaysAgo)

  let pastReach = 0
  let pastEngagement = 0
  let pastWa = 0
  let pastDm = 0

  if (posts) {
    for (const p of posts) {
      const m = Array.isArray(p.post_metrics) ? p.post_metrics[0] : p.post_metrics
      if (m) {
        pastReach += m.reach || 0
        pastEngagement += (m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0)
        pastWa += m.wa_inquiries || 0
        pastDm += m.dm_inquiries || 0
      }
    }
  }

  // Cek active seasonal multiplier
  const todayStr = new Date().toISOString().split('T')[0]
  const { data: seasons } = await supabase
    .from('seasonal_periods')
    .select('impact_multiplier')
    .lte('start_date', todayStr)
    .gte('end_date', todayStr)
    .limit(1)

  const seasonalFactor = seasons && seasons.length > 0 ? Number(seasons[0].impact_multiplier) : 1.0

  // Asumsi projected growth 10% month-over-month + faktor musiman
  const growthRate = 1.10 * seasonalFactor
  const baselineForecast = {
    client_id: clientId,
    target_month: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0],
    forecasted_reach: Math.round(pastReach * growthRate),
    forecasted_er: pastReach > 0 ? Number(((pastEngagement / pastReach) * 100).toFixed(2)) : 0,
    forecasted_wa_inquiries: Math.round(pastWa * growthRate),
    forecasted_dm_inquiries: Math.round(pastDm * growthRate),
    estimated_roi_multiplier: Number((1.25 * seasonalFactor).toFixed(2)),
    confidence_score: posts && posts.length >= 10 ? 0.85 : 0.65,
    model_notes: `Berdasarkan ${posts?.length || 0} postingan 30 hari terakhir. Faktor musiman: ${seasonalFactor}x.`
  }

  return NextResponse.json({
    saved: savedPrediction || null,
    algorithmic_forecast: baselineForecast
  })
}

// POST /api/admin/clients/[id]/analytics/predictions
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return denyForbidden({ userId: user.id, role: profile?.role })

  const body = await request.json()
  const parsed = PredictionInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload tidak valid', details: parsed.error.flatten() }, { status: 400 })
  }

  const { data: prediction, error } = await supabase
    .from('analytics_predictions')
    .insert({
      client_id: clientId,
      ...parsed.data
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ prediction })
}
