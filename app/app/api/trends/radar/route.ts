import { NextResponse } from 'next/server'
import { getCombinedTrendRadar } from '@/lib/trends/radar'
import { createClient } from '@/lib/supabase/server'
import { denyUnauthorized } from '@/lib/auth/guard'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Endpoint internal (dipakai dashboard admin): wajib sesi terautentikasi.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return denyUnauthorized()
  }

  const rl = checkRateLimit(getClientIp(request.headers), 'trends/radar', RATE_LIMITS.read.limit, RATE_LIMITS.read.windowMs)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined

    const items = await getCombinedTrendRadar(category)

    return NextResponse.json(
      {
        success: true,
        count: items.length,
        items,
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=3600, stale-while-revalidate=7200',
        },
      },
    )
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal memuat tren radar'
    logger.error('trends.radar.failed', { route: 'api/trends/radar', userId: user.id, error: errorMsg })
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
