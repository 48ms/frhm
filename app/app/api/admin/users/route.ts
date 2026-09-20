import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'

export const dynamic = 'force-dynamic'

/** GET all users with their client info */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('users')
    .select(`
      id, email, full_name, role, client_id, created_at,
      clients (name)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data ?? [] })
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
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, password, full_name, role, client_id } = await request.json()
  if (!email || !password) return NextResponse.json({ error: 'Email & password required' }, { status: 400 })

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name || email.split('@')[0] }
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 })

  // Insert into public.users
  const { error: profileError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      full_name: full_name || email.split('@')[0],
      role: role || 'client',
      client_id: role === 'client' ? client_id : null,
    })
  if (profileError) {
    // Cleanup auth user if profile insert fails
    await supabase.auth.admin.deleteUser(authData.user.id)
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