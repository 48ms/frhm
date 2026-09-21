import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { logAudit } from '@/lib/audit/log'
import { checkRateLimit, getClientIp } from '@/lib/middleware/rate-limit'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/clients/[id]/revoke-sessions
 *
 * Force-logout semua session milik client: reset password via service role.
 * Supabase tidak expose endpoint revoke-by-user-id (GoTrue /admin/users/{id}/sessions = 404),
 * jadi reset password adalah satu-satunya mekanisme yang bekerja — refresh token
 * lama langsung invalid → client harus login ulang.
 *
 * Admin only. Rate limited (sensitive mutation).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rl = checkRateLimit(getClientIp(request.headers), 'revoke-sessions', 3, 60_000)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi nanti.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 60) } },
    )
  }

  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return denyForbidden({ userId: user.id, role: profile?.role })

  // Find the auth user linked to this client (users.client_id → auth user id)
  const { data: linked } = await supabase
    .from('users')
    .select('id')
    .eq('client_id', id)
    .maybeSingle()

  if (!linked) {
    return NextResponse.json(
      { error: 'Client ini tidak punya akun login. Beri email di pengaturan client.' },
      { status: 404 },
    )
  }

  // Service-role client — auth.admin needs it (JWT user token cannot revoke others)
  const svc = createSupabaseServiceClient()

  // Get auth email for the audit trail
  const { data: authUser, error: fetchErr } = await svc.auth.admin.getUserById(linked.id)
  if (fetchErr || !authUser.user) {
    return NextResponse.json({ error: 'Akun auth tidak ditemukan' }, { status: 404 })
  }

  // Reset password → semua refresh token user invalidated → semua session mati.
  const newPassword = genPassword()
  const { error } = await svc.auth.admin.updateUserById(linked.id, { password: newPassword })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  void logAudit({
    action: 'auth.revoke_sessions',
    actorId: user.id,
    actorRole: 'admin',
    entityType: 'client',
    entityId: id,
    clientId: id,
    summary: `Admin mencabut semua session client ${authUser.user.email ?? 'tanpa email'} (password direset)`,
    metadata: { email: authUser.user.email ?? null },
    request,
  })

  return NextResponse.json({
    success: true,
    message: `Semua session ${authUser.user.email ?? 'client'} dicabut. Client harus login ulang.`,
  })
}

/** 12-char random password — shown exactly once, never stored. */
function genPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  const rand = new Uint8Array(12)
  crypto.getRandomValues(rand)
  for (const b of rand) out += alphabet[b % alphabet.length]
  return out
}