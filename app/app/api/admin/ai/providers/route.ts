import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'
import { logAudit } from '@/lib/audit/log'

export const dynamic = 'force-dynamic'

// Never send api_key back to the browser — report only whether one is set.
function redact<T extends Record<string, unknown>>(row: T) {
  return { ...row, api_key: undefined, has_key: Boolean(row.api_key) }
}

// GET /api/admin/ai/providers
// Lists configured AI provider entries (without API keys). Admin-only because
// the list can reveal infrastructure choices and default provider.
export async function GET() {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const { data, error } = await supabase
    .from('ai_providers').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ providers: (data ?? []).map(redact) })
}

// POST /api/admin/ai/providers
// Create a new AI provider. RLS policy requires is_admin(), but we also verify
// at the app layer to log the correct actorRole for audit.
export async function POST(request: NextRequest) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase, userId } = ctx

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
    actorId: userId,
    actorRole: 'admin',
    entityType: 'ai_provider',
    entityId: (data as Record<string, unknown>)?.id as string | null,
    summary: `Menambah AI provider "${label}" (${kind}/${model})`,
    metadata: { label, kind, model, is_default: Boolean(is_default) },
    request,
  })

  return NextResponse.json({ provider: redact(data as Record<string, unknown>) })
}

// PATCH /api/admin/ai/providers
// Update an existing AI provider (without sending/receiving the full api_key).
export async function PATCH(request: NextRequest) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase, userId } = ctx

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
    actorId: userId,
    actorRole: 'admin',
    entityType: 'ai_provider',
    entityId: id,
    summary: `Memperbarui AI provider ${id}`,
    metadata: { changed_fields: Object.keys(patch) },
    request,
  })

  return NextResponse.json({ provider: redact(data as Record<string, unknown>) })
}

// DELETE /api/admin/ai/providers?id=
// Remove an AI provider. No confirmation gate — just RLS + role check.
export async function DELETE(request: NextRequest) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase, userId } = ctx

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })

  const { error } = await supabase.from('ai_providers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  void logAudit({
    action: 'ai_provider.delete',
    actorId: userId,
    actorRole: 'admin',
    entityType: 'ai_provider',
    entityId: id,
    summary: `Menghapus AI provider ${id}`,
    request,
  })

  return NextResponse.json({ success: true })
}
