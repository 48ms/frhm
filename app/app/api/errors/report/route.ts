/**
 * POST /api/errors/report
 *
 * Receives error reports from client-side error boundaries and forwards them
 * to Telegram + structured log.
 *
 * Rate limited: 30 req/min per IP (same bucket as other mutation routes).
 * Auth not required: error boundaries fire before auth is available.
 */

import { NextResponse } from 'next/server'
import { reportError } from '@/lib/error-reporter'
import { checkRateLimit, getClientIp } from '@/lib/middleware/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const rl = checkRateLimit(
    getClientIp(request.headers),
    'errors/report',
    30,          // 30 error reports per window
    60_000,      // per minute
  )
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const body = await request.json().catch(() => ({}))

  const report = {
    message: typeof body.message === 'string' ? body.message : 'Unknown error',
    name: typeof body.name === 'string' ? body.name : undefined,
    stack: typeof body.stack === 'string' ? body.stack : undefined,
    digest: typeof body.digest === 'string' ? body.digest : undefined,
    url: typeof body.url === 'string' ? body.url : undefined,
    component: typeof body.component === 'string' ? body.component : undefined,
    context: typeof body.context === 'object' && body.context ? body.context : undefined,
  }

  // Fire-and-forget: report in background, respond immediately
  void reportError(report)

  return NextResponse.json({ ok: true })
}
