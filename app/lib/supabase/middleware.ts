import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { USER_HEADERS } from './identity-headers'
import { env } from '@/lib/env'

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

  // Define protected routes
  const isProtectedAdmin = request.nextUrl.pathname.startsWith('/admin')
  const isProtectedClient = request.nextUrl.pathname.startsWith('/client')
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')

  // If user is not logged in and tries to access /admin or /client, redirect to login
  if (!user && (isProtectedAdmin || isProtectedClient)) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search)
    return applyCookies(NextResponse.redirect(url))
  }

  // Tenant Strict Guard & Identity Resolution
  if (user && (isProtectedAdmin || isProtectedClient || isAuthPage)) {
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
      const url = request.nextUrl.clone()
      if (userProfile?.role === 'client') {
        url.pathname = '/client/dashboard'
      } else if (userProfile?.role === 'admin') {
        url.pathname = '/admin/dashboard'
      } else {
        url.pathname = '/waitlist'
      }
      return applyCookies(NextResponse.redirect(url))
    }

    // User without role or profile in public.users -> redirect to waitlist
    if (!userProfile?.role) {
      const url = request.nextUrl.clone()
      url.pathname = '/waitlist'
      return applyCookies(NextResponse.redirect(url))
    }

    // Role: Client
    if (userProfile.role === 'client') {
      const ownClientId = userProfile.client_id
      // Client without bound client_id cannot access data -> waitlist
      if (!ownClientId) {
        const url = request.nextUrl.clone()
        url.pathname = '/waitlist'
        return applyCookies(NextResponse.redirect(url))
      }

      // Client attempting to access agency admin -> redirect to client portal
      if (isProtectedAdmin) {
        const url = request.nextUrl.clone()
        url.pathname = '/client/dashboard'
        url.searchParams.set('clientId', ownClientId)
        return applyCookies(NextResponse.redirect(url))
      }

      // Client in /client/* -> enforce clientId matches ownClientId strictly
      if (isProtectedClient && requestedClientId !== ownClientId) {
        const url = request.nextUrl.clone()
        url.searchParams.set('clientId', ownClientId)
        return applyCookies(NextResponse.redirect(url))
      }
    }

    // Role: Admin
    // Admin has full access to /admin/* and can view /client/* for any client
  }

  // Inject security headers
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  supabaseResponse.headers.set(
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

  return supabaseResponse
}
