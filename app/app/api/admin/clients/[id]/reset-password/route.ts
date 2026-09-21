import { createServerClient } from '@supabase/ssr'
// eslint-disable-next-line no-restricted-imports
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit/log'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'
import { checkRateLimit, getClientIp } from '@/lib/middleware/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/clients/[id]/reset-password
 *
 * Regenerates the password for the client's login account and returns it ONCE.
 * The old password (if the client never changed it) stops working immediately.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Rate limit: reset-password is a sensitive mutation — cap at 3 per IP per 60s.
  const rl = checkRateLimit(getClientIp(_request.headers), 'reset-password', 3, 60_000)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan reset password. Coba lagi nanti.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 60) } },
    )
  }
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() { /* read */ },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return denyForbidden()
  }

  // Find the auth user linked to this client (users.client_id → auth user id)
  const { data: linked } = await supabase
    .from('users')
    .select('id')
    .eq('client_id', (await params).id)
    .maybeSingle()

  if (!linked) {
    return NextResponse.json(
      { error: 'Client ini tidak punya akun login. Beri email di pengaturan client.' },
      { status: 404 },
    )
  }

  // Get the auth email + reset the password via the admin (service-role) client
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { data: authUser, error: fetchErr } = await admin.auth.admin.getUserById(linked.id)
  if (fetchErr || !authUser.user) {
    return NextResponse.json({ error: 'Akun auth tidak ditemukan' }, { status: 404 })
  }

  const password = genPassword()
  const { error } = await admin.auth.admin.updateUserById(linked.id, { password })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logAudit({
    actorId: user.id,
    actorRole: 'admin',
    action: 'client.reset_password',
    entityType: 'client',
    entityId: (await params).id,
    clientId: (await params).id,
    summary: `Admin mereset password akun client (${authUser.user.email ?? 'tanpa email'})`,
    // deliberately NOT logging the password itself
    metadata: { email: authUser.user.email ?? null },
  })

  return NextResponse.json({ success: true, email: authUser.user.email, password })
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