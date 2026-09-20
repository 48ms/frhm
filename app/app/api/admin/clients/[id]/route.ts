import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit/log'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) {
          try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = checkRateLimit(getClientIp(request.headers), 'admin/clients', RATE_LIMITS.mutation.limit, RATE_LIMITS.mutation.windowMs)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi dalam beberapa detik.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  const { id } = await params
  const supabase = await getSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return denyForbidden()
  }

  const body = await request.json().catch(() => ({}))

  const patch: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim()
  if ('contact_email' in body) patch.contact_email = body.contact_email?.trim() || null
  if ('contact_phone' in body) patch.contact_phone = body.contact_phone?.trim() || null
  if (body.brand_profile && typeof body.brand_profile === 'object') {
    patch.brand_profile = body.brand_profile
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Tidak ada perubahan' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('clients')
    .update(patch)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  void logAudit({
    action: 'client.update',
    actorId: user.id,
    actorRole: profile?.role ?? null,
    entityType: 'client',
    entityId: id,
    clientId: id,
    summary: `Memperbarui profil client ${id}`,
    metadata: { changes: Object.keys(patch) },
    request,
  })

  return NextResponse.json({ success: true, data })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return denyForbidden()
  }

  // refuse if the client still has deliverables (avoid orphaned rows)
  const { count } = await supabase
    .from('deliverables')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', id)
  if ((count ?? 0) > 0) {
    return NextResponse.json(
      { error: `Client masih punya ${count} deliverable. Hapus dulu deliverable-nya.` },
      { status: 400 }
    )
  }

  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  void logAudit({
    action: 'client.delete',
    actorId: user.id,
    actorRole: profile?.role ?? null,
    entityType: 'client',
    entityId: id,
    clientId: id,
    summary: `Menghapus client ${id}`,
    request,
  })

  return NextResponse.json({ success: true })
}
