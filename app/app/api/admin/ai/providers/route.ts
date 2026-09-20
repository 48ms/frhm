import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logAudit } from '@/lib/audit/log'

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

// Never send api_key back to the browser — report only whether one is set.
function redact<T extends Record<string, unknown>>(row: T) {
  return { ...row, api_key: undefined, has_key: Boolean(row.api_key) }
}

export async function GET() {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const { data, error } = await supabase
    .from('ai_providers').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ providers: (data ?? []).map(redact) })
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const b = await request.json().catch(() => ({}))
  const { label, kind, model, base_url, api_key, is_default } = b ?? {}
  if (!label || !kind || !model) {
    return NextResponse.json({ error: 'label, kind, dan model wajib' }, { status: 400 })
  }
  if (!['gemini', 'anthropic', 'openai', 'custom'].includes(kind)) {
    return NextResponse.json({ error: 'kind tidak dikenal' }, { status: 400 })
  }

  if (is_default) {
    await supabase.from('ai_providers').update({ is_default: false }).eq('is_default', true)
  }

  const { data, error } = await supabase
    .from('ai_providers')
    .insert({
      label, kind, model,
      base_url: base_url || null,
      api_key: api_key || null,
      is_default: Boolean(is_default),
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  void logAudit({
    action: 'ai_provider.create',
    actorId: user.id,
    actorRole: 'admin',
    entityType: 'ai_provider',
    entityId: (data as Record<string, unknown>)?.id as string | null,
    summary: `Menambah AI provider "${label}" (${kind}/${model})`,
    metadata: { label, kind, model, is_default: Boolean(is_default) },
    request,
  })

  return NextResponse.json({ provider: redact(data as Record<string, unknown>) })
}

export async function PATCH(request: NextRequest) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const b = await request.json().catch(() => ({}))
  const { id, is_default, ...rest } = b ?? {}
  if (!id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })

  if (is_default) {
    await supabase.from('ai_providers').update({ is_default: false }).eq('is_default', true)
  }
  const patch: Record<string, unknown> = {}
  for (const k of ['label', 'kind', 'model', 'base_url', 'api_key']) {
    if (rest[k] !== undefined && rest[k] !== '') patch[k] = rest[k]
  }
  if (is_default !== undefined) patch.is_default = Boolean(is_default)

  const { data, error } = await supabase
    .from('ai_providers').update(patch).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  void logAudit({
    action: 'ai_provider.update',
    actorId: user.id,
    actorRole: 'admin',
    entityType: 'ai_provider',
    entityId: id,
    summary: `Memperbarui AI provider ${id}`,
    metadata: { changed_fields: Object.keys(patch) },
    request,
  })

  return NextResponse.json({ provider: redact(data as Record<string, unknown>) })
}

export async function DELETE(request: NextRequest) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })

  const { error } = await supabase.from('ai_providers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  void logAudit({
    action: 'ai_provider.delete',
    actorId: user.id,
    actorRole: 'admin',
    entityType: 'ai_provider',
    entityId: id,
    summary: `Menghapus AI provider ${id}`,
    request,
  })

  return NextResponse.json({ success: true })
}
