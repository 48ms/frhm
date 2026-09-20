import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

// Enable every skill in a pack for one client (idempotent).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  const supabase = await getSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const packId: string | undefined = body?.pack_id
  if (!packId) return NextResponse.json({ error: 'pack_id wajib' }, { status: 400 })

  // skills that belong to this pack
  const { data: links, error: linkErr } = await supabase
    .from('pack_skills')
    .select('skill_id')
    .eq('pack_id', packId)

  if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 400 })
  const skillIds = (links ?? []).map((l) => l.skill_id)
  if (skillIds.length === 0) {
    return NextResponse.json({ error: 'Paket ini belum punya skill' }, { status: 400 })
  }

  // upsert without clobbering existing status
  const { data: existing } = await supabase
    .from('client_skills')
    .select('skill_id')
    .eq('client_id', clientId)
    .in('skill_id', skillIds)

  const have = new Set((existing ?? []).map((r) => r.skill_id))
  const toInsert = skillIds
    .filter((s) => !have.has(s))
    .map((skill_id) => ({ client_id: clientId, skill_id, status: 'belum' }))

  if (toInsert.length > 0) {
    const { error } = await supabase.from('client_skills').insert(toInsert)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, added: toInsert.length, already: have.size })
}

// Update the status/notes of one client skill.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  const supabase = await getSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const skillId: string | undefined = body?.skill_id
  const status: string | undefined = body?.status
  if (!skillId) return NextResponse.json({ error: 'skill_id wajib' }, { status: 400 })
  if (status && !['belum', 'jalan', 'selesai'].includes(status)) {
    return NextResponse.json({ error: 'status tidak valid' }, { status: 400 })
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (status) patch.status = status
  if ('notes' in body) patch.notes = body.notes || null

  const { error } = await supabase
    .from('client_skills')
    .update(patch)
    .eq('client_id', clientId)
    .eq('skill_id', skillId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

// Remove a whole pack from a client (all its skills).
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  const supabase = await getSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin' }, { status: 403 })
  }

  const packId = new URL(request.url).searchParams.get('pack_id')
  if (!packId) return NextResponse.json({ error: 'pack_id wajib' }, { status: 400 })

  const { data: links } = await supabase
    .from('pack_skills').select('skill_id').eq('pack_id', packId)
  const skillIds = (links ?? []).map((l) => l.skill_id)
  if (skillIds.length === 0) return NextResponse.json({ success: true, removed: 0 })

  const { error } = await supabase
    .from('client_skills')
    .delete()
    .eq('client_id', clientId)
    .in('skill_id', skillIds)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, removed: skillIds.length })
}
