import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { logAudit } from '@/lib/audit/log'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

/** Admin client bypasses RLS + has auth.admin access */
function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/** GET all users with their client info */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return denyForbidden({ userId: user.id, role: profile?.role })

  const { data, error } = await supabase
    .from('users')
    .select(`
      id, full_name, role, client_id, created_at,
      clients(name)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enrich with auth.email + last_sign_in_at via service-role client (admin-only).
  // Supabase Auth is the source of truth for both — public.users has no such columns.
  try {
    const svc = serviceClient()
    const { data: authUsers } = await svc.auth.admin.listUsers()
    const authMap = new Map<string, { email: string | null; last_sign_in_at: string | null }>()
    for (const au of authUsers.users) {
      authMap.set(au.id, {
        email: au.email ?? null,
        last_sign_in_at: au.last_sign_in_at ?? null,
      })
    }
    const enriched = (data ?? []).map(u => ({
      ...u,
      email: authMap.get(u.id)?.email ?? null,
      last_sign_in_at: authMap.get(u.id)?.last_sign_in_at ?? null,
    }))
    return NextResponse.json({ users: enriched })
  } catch {
    // Auth admin API unreachable — return base rows (no email/last_login)
    return NextResponse.json({ users: data ?? [] })
  }
}

/** POST create new admin user */
export async function POST(request: Request) {
  const rl = checkRateLimit(getClientIp(request.headers), 'admin/users', RATE_LIMITS.mutation.limit, RATE_LIMITS.mutation.windowMs)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi dalam beberapa detik.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return denyForbidden({ userId: user.id, role: profile?.role })

  const { email, password, full_name, role, client_id } = await request.json()
  if (!email || !password) return NextResponse.json({ error: 'Email & password required' }, { status: 400 })

  // Use service-role client for auth.admin.createUser (required by Supabase)
  const svc = serviceClient()
  const { data: authData, error: authError } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name || email.split('@')[0] },
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  // public.users row is auto-created by the handle_new_user() trigger (migration 003).
  // Upsert to set role/client_id (no email column — email lives in auth.users only).
  const { error: profileError } = await svc
    .from('users')
    .upsert({
      id: authData.user.id,
      full_name: full_name || email.split('@')[0],
      role: role || 'client',
      client_id: role === 'client' ? client_id : null,
    }, { onConflict: 'id' })
  if (profileError) {
    // Roll back the auth user — a login with no profile row is unusable.
    await svc.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  void logAudit({
    action: 'user.create',
    actorId: user.id,
    actorRole: profile?.role ?? null,
    entityType: 'user',
    entityId: authData.user.id,
    clientId: role === 'client' ? client_id : null,
    summary: `Membuat user baru: ${email} (${role || 'client'})`,
    metadata: { email, role: role || 'client' },
    request,
  })

  return NextResponse.json({ user: { id: authData.user.id, email, role: role || 'client' } })
}
