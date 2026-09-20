import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit/log'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const redirect = searchParams.get('redirect') || '/admin/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
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
          const url = new URL(redirect, request.url)
          return NextResponse.redirect(url)
        }
        // Authenticated but no profile role — suspicious, log it.
        void logAudit({
          action: 'auth.login.no_role',
          actorId: user.id,
          actorName: user.email ?? null,
          summary: 'Login berhasil tapi user tidak punya role',
          request,
        })
      }
    } else {
      // Failed code exchange — security event.
      void logAudit({
        action: 'auth.login.failed',
        summary: `Login gagal: ${error.message}`,
        request,
      })
    }
  }

  // If no role or error → waitlist
  const url = new URL('/waitlist', request.url)
  return NextResponse.redirect(url)
}