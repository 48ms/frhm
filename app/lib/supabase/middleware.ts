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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  // If user is logged in and tries to access /auth pages, redirect to dashboard
  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
