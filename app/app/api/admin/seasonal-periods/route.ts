import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

// GET /api/admin/seasonal-periods
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: periods, error } = await supabase
    .from('seasonal_periods')
    .select('*')
    .order('start_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ periods: periods || [] })
}
