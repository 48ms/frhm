import { NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'

export const dynamic = 'force-dynamic'

// GET /api/admin/seasonal-periods
// Returns the seasonal marketing calendar (config data, admin-only).
// RLS on seasonal_periods only gates writes (is_admin); the public read policy is
// intentional (client analytics shows seasonal badges), but this endpoint is admin-only
// because it returns the full unscoped list including future/internal periods.
export async function GET() {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const { data: periods, error } = await supabase
    .from('seasonal_periods')
    .select('*')
    .order('start_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ periods: periods || [] })
}
