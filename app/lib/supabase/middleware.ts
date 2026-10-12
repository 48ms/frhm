import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
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
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')

  // If user is not logged in and tries to access /admin, redirect to login
  if (!user && isProtectedAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Tenant Strict Guard: non-admin users may ONLY ever see their own client's
  // data on the shared /admin/* routes (there is no separate /client portal).
  // If a clientId param is absent or does not match their binding, force it to
  // their own client_id so they cannot read another tenant via clients[0].
  if (user && isProtectedAdmin) {
    const requestedClientId = request.nextUrl.searchParams.get('clientId')

    // Ambil profile user dari public.users untuk cek role & binding
    const { data: userProfile } = await supabase
      .from('users')
      .select('role, client_id')
      .eq('id', user.id)
      .single()

    if (userProfile && userProfile.role !== 'admin') {
      const ownClientId = userProfile.client_id
      // Only enforce when we know the tenant; otherwise let the page render.
      if (ownClientId && requestedClientId !== ownClientId) {
        const url = request.nextUrl.clone()
        url.searchParams.set('clientId', ownClientId)
        return NextResponse.redirect(url)
      }
    }
  }

  // If user is logged in and tries to access /auth pages, redirect to dashboard
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
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
      "connect-src 'self' https://*.supabase.co https://app.ayrshare.com https://api.woopsocial.com",
      "frame-ancestors 'none'",
    ].join('; ')
  )

  return supabaseResponse
}
