import { NextResponse } from 'next/server'
import { getCombinedTrendRadar } from '@/lib/trends/radar'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
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
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    )
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal memuat tren radar'
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
