import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { USER_HEADERS } from './identity-headers'
import { env } from '@/lib/env'
import { getRequestOrigin } from '@/lib/request-origin'
import { checkRateLimit, getClientIp } from '@/lib/middleware/rate-limit'

/**
 * PERF: previously every /admin request paid FOUR sequential Supabase
 * round-trips before rendering:
 *   middleware getUser()      ~114ms (warm) / ~600ms (cold)
 *   middleware SELECT users   ~183ms (warm) / ~600ms (cold)
 *   layout     getUser()      ~114ms (DUPLICATE)
 *   layout     SELECT users   ~183ms (DUPLICATE)
 * Now the layout pays zero: the middleware forwards the resolved identity as
 * request headers and the layout just reads them.
 */
export async function updateSession(request: NextRequest) {
  // Headers forwarded to the route render. A single mutable object keeps every
  // response we build in sync with the latest identity values.
  const requestHeaders = new Headers(request.headers)

  // SECURITY: strip any client-supplied identity headers BEFORE we set our own.
  // Without this, an unauthenticated request could send `x-user-id` itself and
  // the layout would trust it. Middleware is the only trusted writer.
  for (const key of Object.values(USER_HEADERS)) {
    requestHeaders.delete(key)
  }

  const isReviewPath = request.nextUrl.pathname.startsWith('/review/')

  const applySecurityHeaders = (res: NextResponse) => {
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set(
      'Referrer-Policy',
      isReviewPath ? 'no-referrer' : 'strict-origin-when-cross-origin'
    )
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    if (isReviewPath) {
      res.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
      res.headers.set('Cache-Control', 'private, no-store')
    }
    res.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://app.ayrshare.com https://api.woopsocial.com https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://openrouter.ai https://*.ingest.us.sentry.io https://*.ingest.sentry.io",
        "frame-ancestors 'none'",
      ].join('; ')
    )
    return res
  }

  // Bypass session check for public webhooks & metadata assets to avoid unnecessary round-trips
  const pathname = request.nextUrl.pathname

  if (isReviewPath) {
    const reviewLimit = checkRateLimit(getClientIp(request.headers), 'review-portal', 60, 60_000)
    if (reviewLimit.limited) {
      const limited = new NextResponse('Too many requests', {
        status: 429,
        headers: { 'Retry-After': String(reviewLimit.retryAfter ?? 60) },
      })
      return applySecurityHeaders(limited)
    }
  }

  const isPublicBypass =
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/telegram') ||
    pathname.startsWith('/api/whatsapp') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.webmanifest'

  if (isPublicBypass) {
    return applySecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }))
  }

  // Cookies queued by supabase's setAll() — applied to whichever response we
  // finally return (next or redirect) so a refreshed session is never dropped.
  let pendingCookies: { name: string; value: string; options?: Record<string, unknown> }[] = []

  const applyCookies = (res: NextResponse) => {
    for (const { name, value, options } of pendingCookies) {
      res.cookies.set(name, value, options as never)
    }
    return res
  }

  const buildNextResponse = () =>
    applyCookies(NextResponse.next({ request: { headers: requestHeaders } }))

  /**
   * Safely builds redirect responses using the public host (e.g. https://frhm.web.id)
   * instead of internal loopback (http://localhost:3000), preventing ERR_CONNECTION_REFUSED.
   * Also ensures pending cookies & security headers are preserved on 307/308 responses.
   */
  const createSafeRedirectResponse = (
    targetPathname: string,
    params?: Record<string, string> | URLSearchParams
  ) => {
    const origin = getRequestOrigin(request)
    const targetUrl = new URL(targetPathname, origin)
    if (params) {
      if (params instanceof URLSearchParams) {
        params.forEach((val, key) => targetUrl.searchParams.set(key, val))
      } else {
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) {
            targetUrl.searchParams.set(key, value)
          }
        }
      }
    }
    const redirectRes = NextResponse.redirect(targetUrl)
    return applySecurityHeaders(applyCookies(redirectRes))
  }

  let supabaseResponse = buildNextResponse()

  const supabase = createServerClient(
    env.server.NEXT_PUBLIC_SUPABASE_URL,
    env.server.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          pendingCookies = cookiesToSet
          supabaseResponse = buildNextResponse()
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT use getSession, use getUser.
  // getSession is prone to spoofing.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Define protected & special routes
  const isProtectedAdmin = pathname.startsWith('/admin')
  const isProtectedClient = pathname.startsWith('/client')
  const isAuthPage = pathname.startsWith('/auth')
  const isWaitlistPage = pathname.startsWith('/waitlist')

  // If user is not logged in and tries to access /admin or /client, redirect to login
  if (!user && (isProtectedAdmin || isProtectedClient)) {
    const nextPath = request.nextUrl.pathname + request.nextUrl.search
    return createSafeRedirectResponse('/auth/login', { next: nextPath })
  }

  // Tenant Strict Guard & Identity Resolution
  if (user && (isProtectedAdmin || isProtectedClient || isAuthPage || isWaitlistPage)) {
    const requestedClientId = request.nextUrl.searchParams.get('clientId')

    // Ambil profile user dari public.users untuk cek role & binding.
    // `full_name` ikut diambil supaya layout tidak perlu query ulang.
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, client_id, full_name')
      .eq('id', user.id)
      .single()

    const effectiveClientId = userProfile?.role === 'admin'
      ? (requestedClientId || userProfile?.client_id || '')
      : (userProfile?.client_id || '')

    // Hand the resolved identity to layouts via request headers.
    requestHeaders.set(USER_HEADERS.id, user.id)
    requestHeaders.set(USER_HEADERS.email, user.email ?? '')
    requestHeaders.set(USER_HEADERS.role, userProfile?.role ?? '')
    requestHeaders.set(USER_HEADERS.name, userProfile?.full_name ?? '')
    requestHeaders.set(USER_HEADERS.clientId, effectiveClientId)
    supabaseResponse = buildNextResponse()

    // If user is logged in and visits auth page, redirect based on role
    if (isAuthPage) {
      if (userProfile?.role === 'client' && userProfile.client_id) {
        return createSafeRedirectResponse('/client/dashboard')
      } else if (userProfile?.role === 'admin') {
        return createSafeRedirectResponse('/admin/dashboard')
      }
      // User with no role or unbound client_id is allowed to view /auth/login
      // so they can log out, switch accounts, or log in with an authorized user.
      return applySecurityHeaders(supabaseResponse)
    }

    // If user is logged in and visits waitlist page, redirect if already approved
    if (isWaitlistPage) {
      if (userProfile?.role === 'client' && userProfile.client_id) {
        return createSafeRedirectResponse('/client/dashboard')
      } else if (userProfile?.role === 'admin') {
        return createSafeRedirectResponse('/admin/dashboard')
      }
      // User without role or unbound client stays on waitlist
      return applySecurityHeaders(supabaseResponse)
    }

    // User without role or profile in public.users -> redirect to waitlist
    if (!userProfile?.role) {
      return createSafeRedirectResponse('/waitlist')
    }

    // Role: Client
    if (userProfile.role === 'client') {
      const ownClientId = userProfile.client_id
      // Client without bound client_id cannot access data -> waitlist
      if (!ownClientId) {
        return createSafeRedirectResponse('/waitlist')
      }

      // Client attempting to access agency admin -> redirect to client portal
      if (isProtectedAdmin) {
        return createSafeRedirectResponse('/client/dashboard', { clientId: ownClientId })
      }

      // Client in /client/* -> enforce clientId matches ownClientId strictly
      if (isProtectedClient && requestedClientId !== ownClientId) {
        const searchParams = new URLSearchParams(request.nextUrl.searchParams)
        searchParams.set('clientId', ownClientId)
        return createSafeRedirectResponse(request.nextUrl.pathname, searchParams)
      }
    }

    // Role: Admin
    // Admin has full access to /admin/* and can view /client/* for any client
  }

  return applySecurityHeaders(supabaseResponse)
}
