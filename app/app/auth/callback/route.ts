import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit/log'
import { checkRateLimit } from '@/lib/middleware/rate-limit'
import { safeRedirect } from '@/lib/safe-redirect'

const RATE_LIMIT = 5
const RATE_WINDOW_MS = 60_000 // 5 attempts per minute

function getIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

export async function GET(request: NextRequest) {
  const ip = getIp(request)
  const limited = checkRateLimit(ip, 'auth/callback', RATE_LIMIT, RATE_WINDOW_MS)
  if (limited.limited) {
    void logAudit({
      action: 'auth.rate_limited',
      summary: `Auth callback rate limited: ${ip}`,
      request,
    })
    const url = new URL('/waitlist', request.url)
    return NextResponse.redirect(url)
  }

  const { searchParams } = new URL(request.url)
  const redirect = safeRedirect(searchParams.get('redirect'), '/admin/dashboard')
  const oauthError = searchParams.get('error_description') || searchParams.get('error')
  const code = searchParams.get('code')

  if (oauthError) {
    void logAudit({
      action: 'auth.oauth.error',
      summary: `OAuth error dari provider: ${oauthError}`,
      request,
    })
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('error', oauthError)
    return NextResponse.redirect(loginUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role, client_id')
          .eq('id', user.id)
          .single()

        if (profile?.role) {
          void logAudit({
            action: 'auth.login.success',
            actorId: user.id,
            actorRole: profile.role,
            actorName: user.email ?? null,
            summary: `Login berhasil (${profile.role})`,
            request,
          })
          const defaultTarget = profile.role === 'client'
            ? (profile.client_id ? `/client/dashboard?clientId=${profile.client_id}` : '/client/dashboard')
            : '/admin/dashboard'
          const explicitRedirect = searchParams.get('redirect')
          let destination = explicitRedirect ? safeRedirect(explicitRedirect, defaultTarget) : defaultTarget
          if (profile.role === 'client' && !destination.startsWith('/client')) {
            destination = defaultTarget
          }
          const url = new URL(destination, request.url)
          return NextResponse.redirect(url)
        }
        void logAudit({
          action: 'auth.login.no_role',
          actorId: user.id,
          actorName: user.email ?? null,
          summary: 'Login berhasil tapi user tidak punya role',
          request,
        })
        const waitlistUrl = new URL('/waitlist', request.url)
        return NextResponse.redirect(waitlistUrl)
      }
    } else {
      void logAudit({
        action: 'auth.login.failed',
        summary: `Login gagal: ${error.message}`,
        request,
      })
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('error', error.message || 'Gagal autentikasi dengan penyedia pihak ketiga')
      return NextResponse.redirect(loginUrl)
    }
  }

  const url = new URL('/auth/login', request.url)
  return NextResponse.redirect(url)
}
