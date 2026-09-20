import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit/log'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase
    .from('users').select('role, client_id').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'client') return denyForbidden()

  // Pagination: ?page=N&limit=M (default 50, max 100)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const rawLimit = parseInt(searchParams.get('limit') ?? '50', 10) || 50
  const limit = Math.min(Math.max(1, rawLimit), 100)
  const from = (page - 1) * limit
  const to = from + limit - 1

  const queryClientId = searchParams.get('client_id')

  let query = supabase
    .from('deliverables')
    .select('id, type, title, status, created_at, updated_at, client_id', { count: 'exact' })
    .order('created_at', { ascending: false })

  // Clients can only see their own deliverables
  if (profile.role === 'client') {
    query = query.eq('client_id', profile.client_id)
  } else if (queryClientId) {
    query = query.eq('client_id', queryClientId)
  }

  const status = searchParams.get('status')
  if (status) query = query.eq('status', status)

  const { data, error, count } = await query.range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deliverables: data ?? [], total: count ?? 0, page, limit })
}

export async function POST(request: Request) {
  const rl = checkRateLimit(getClientIp(request.headers), 'admin/deliverables', RATE_LIMITS.mutation.limit, RATE_LIMITS.mutation.windowMs)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi dalam beberapa detik.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch { /* server component */ }
        },
      },
    }
  )

  const body = await request.json().catch(() => ({}))
  const { type, title, content_md, external_link, client_id } = body

  if (!type || !title) {
    return NextResponse.json({ error: 'Type dan title wajib diisi' }, { status: 400 })
  }
  if (!client_id) {
    return NextResponse.json({ error: 'Client wajib dipilih' }, { status: 400 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang bisa membuat deliverable' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('deliverables')
    .insert({
      type,
      title,
      content_md: content_md ?? '',
      external_link: external_link || null,
      status: 'draft',
      created_by: user.id,
      updated_by: user.id,
      client_id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  void logAudit({
    action: 'deliverable.create',
    actorId: user.id,
    actorRole: profile?.role ?? null,
    entityType: 'deliverable',
    entityId: (data as Record<string, unknown>)?.id as string | null,
    clientId: client_id,
    summary: `Membuat deliverable baru: ${title} (${type})`,
    request,
  })

  return NextResponse.json({ success: true, data }, { status: 201 })
}
