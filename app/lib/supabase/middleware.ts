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
          cookiesToSet.forEach(({ name, value, options: _options }) => request.cookies.set(name, value))
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

  // Tenant Strict Guard: Cek apakah user berhak mengakses clientId di URL
  if (user && isProtectedAdmin) {
    const requestedClientId = request.nextUrl.searchParams.get('clientId')
    
    // Jika ada clientId di URL, lakukan verifikasi akses
    if (requestedClientId) {
      // Ambil profile user dari public.users untuk cek role & binding
      const { data: userProfile } = await supabase
        .from('users')
        .select('role, client_id')
        .eq('id', user.id)
        .single()

      // Jika user bukan super-admin dan mencoba mengakses client_id yang bukan miliknya
      if (userProfile && userProfile.role !== 'admin' && userProfile.client_id !== requestedClientId) {
        const url = request.nextUrl.clone()
        // Override clientId ke milik user sendiri
        if (userProfile.client_id) {
          url.searchParams.set('clientId', userProfile.client_id)
        } else {
          url.searchParams.delete('clientId')
        }
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

  return supabaseResponse
}
