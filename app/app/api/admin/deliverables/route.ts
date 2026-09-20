import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit/log'

export async function POST(request: Request) {
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
  if (!user) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

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
