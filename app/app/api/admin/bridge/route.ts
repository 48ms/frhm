import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'
import { health, listProjects, listSocialAccounts, listMedia } from '@/lib/bridge/woopsocial'

export const dynamic = 'force-dynamic'

/**
 * Bridge status. Reports connectivity and the discovered projects/accounts.
 *
 * The API key never leaves the server: this returns booleans and the discovered data only.
 * "Project and account identifiers are surfaced automatically — discover them, don't ask the
 * user to paste IDs" (tools/integrations/woopsocial.md), so we fetch them here.
 */
export async function GET() {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const { data: cfg } = await supabase
    .from('bridge_config')
    .select('enabled, api_key, last_ok_at, last_error, last_checked_at')
    .eq('id', 'woopsocial')
    .maybeSingle()

  const key = (cfg?.api_key as string | null) ?? null

  // No key configured — report honestly (the repo's "not connected" state, never a fake success)
  if (!key) {
    return NextResponse.json({
      configured: false,
      connected: false,
      hint: 'API key belum diisi. Buat di app.woopsocial.com/api-access lalu simpan di sini.',
    })
  }

  const h = await health(key)
  const now = new Date().toISOString()

  if (!h.ok) {
    await supabase
      .from('bridge_config')
      .update({ last_error: h.error, last_checked_at: now, last_ok_at: null })
      .eq('id', 'woopsocial')
    return NextResponse.json({
      configured: true,
      connected: false,
      error: h.error,
      status: h.status ?? null,
      hint:
        h.status === 401 || h.status === 403
          ? 'API key ditolak. Cek key di app.woopsocial.com/api-access (akses API ada di paket berbayar).'
          : 'Bridge tidak bisa dihubungi.',
    })
  }

  const [projects, accounts] = await Promise.all([listProjects(key), listSocialAccounts(key)])

  // Media matters because Instagram refuses a post without at least one item (the bridge says so
  // itself: "Instagram posts require at least one media item"). Reporting the count here means the
  // Publish stage can warn before anyone tries to send something that cannot go out.
  const projectId = projects.ok ? projects.data[0]?.id : undefined
  const media = await listMedia(key, projectId)

  await supabase
    .from('bridge_config')
    .update({ last_ok_at: now, last_error: null, last_checked_at: now })
    .eq('id', 'woopsocial')

  return NextResponse.json({
    configured: true,
    connected: true,
    projects: projects.ok ? projects.data : [],
    accounts: accounts.ok ? accounts.data : [],
    mediaCount: media.ok ? media.data.length : null,
    error: accounts.ok ? null : accounts.error,
  })
}

/** Save or clear the API key. Admin only; the value is never echoed back. */
export async function POST(request: NextRequest) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const body = await request.json().catch(() => ({}))
  const { api_key } = body ?? {}

  if (typeof api_key !== 'string') {
    return NextResponse.json({ error: 'api_key wajib (string)' }, { status: 400 })
  }

  const trimmed = api_key.trim()
  const patch = trimmed
    ? { api_key: trimmed, enabled: true }
    : { api_key: null, enabled: false, last_ok_at: null, last_error: null }

  const { error } = await supabase.from('bridge_config').update(patch).eq('id', 'woopsocial')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Report the key's presence, never its value.
  return NextResponse.json({ ok: true, configured: Boolean(trimmed) })
}
