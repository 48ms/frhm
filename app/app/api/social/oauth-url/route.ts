import { NextResponse } from 'next/server'
import { z } from 'zod'
import { env } from '@/lib/env'
import { createSocialOAuthSession } from '@/lib/social/oauth-session'
import { OAUTH_STATE_COOKIE, OAUTH_STATE_TTL_SECONDS } from '@/lib/social/oauth-state'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'

const bodySchema = z.object({
  clientId: z.string().min(1, 'clientId wajib diisi'),
  platform: z.string().min(1, 'platform wajib diisi'),
})

export async function POST(req: Request) {
  try {
    // Rate limiting: 5 requests per minute for OAuth URL generation
    const clientIp = getClientIp(req.headers)
    const rateLimit = checkRateLimit(clientIp, '/api/social/oauth-url', RATE_LIMITS.auth.limit, RATE_LIMITS.auth.windowMs)
    if (rateLimit.limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } },
      )
    }
    const rawBody = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Missing clientId or platform' },
        { status: 400 },
      )
    }

    const { url, stateToken } = await createSocialOAuthSession(parsed.data)

    const response = NextResponse.json({ success: true, url })
    response.cookies.set({
      name: OAUTH_STATE_COOKIE,
      value: stateToken,
      httpOnly: true,
      secure: env.server.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: OAUTH_STATE_TTL_SECONDS,
    })
    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    const status = message === 'Unauthorized' ? 401 : message === 'Forbidden' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
