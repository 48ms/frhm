import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'
import {
  listProjects, listSocialAccounts, generateOAuthUrl, toBridgePlatform, disconnectAccount,
} from '@/lib/bridge/woopsocial'

export const dynamic = 'force-dynamic'

/**
 * Per-client channel connection.
 *
 * The repo's model is one client per project, and woopsocial.md documents the exact flow for a
 * multi-user integration like this one:
 *   1. create/select a project for the client,
 *   2. call generate-oauth-url with projectId + platform + redirectUrl,
 *   3. the client opens the URL and approves in their own browser,
 *   4. we confirm the new account via the social-accounts listing.
 *
 * This route does (2) and (4) — and it never stores the account ID long-term: identifiers are
 * "surfaced automatically" so we read them live and keep only the honest connection status.
 */
export async function POST(request: NextRequest) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const body = await request.json().catch(() => ({}))
  const { client_id, platform, action, redirect_url } = body ?? {}

  if (!client_id || !platform) {
    return NextResponse.json({ error: 'client_id dan platform wajib' }, { status: 400 })
  }

  const { data: cfg } = await supabase
    .from('bridge_config').select('api_key').eq('id', 'woopsocial').maybeSingle()
  const key = (cfg?.api_key as string | null) ?? null
  if (!key) {
    return NextResponse.json(
      { error: 'Bridge belum dikonfigurasi. Isi API key WoopSocial dulu.' },
      { status: 400 }
    )
  }

  const bridgePlatform = toBridgePlatform(platform)
  if (!bridgePlatform) {
    return NextResponse.json({ error: `Platform ${platform} tidak didukung bridge` }, { status: 400 })
  }

  if (action === 'check') {
    const accounts = await listSocialAccounts(key)
    if (!accounts.ok) {
      return NextResponse.json({ error: accounts.error }, { status: 502 })
    }
    const match = accounts.data.find((a) => a.platform === bridgePlatform)

    const patch = match
      ? {
          status: 'terhubung',
          handle: match.username ? `@${match.username.replace(/^@/, '')}` : null,
          note: null,
          confirmed_at: new Date().toISOString(),
        }
      : { status: 'belum', handle: null, confirmed_at: null, note: 'Akun belum terhubung di bridge' }

    const { error } = await supabase
      .from('client_channels')
      .upsert(
        { client_id, platform: platform.toLowerCase(), ...patch },
        { onConflict: 'client_id,platform' }
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, connected: Boolean(match), account: match ?? null })
  }

  if (action === 'disconnect') {
    const accounts = await listSocialAccounts(key)
    if (!accounts.ok) return NextResponse.json({ error: accounts.error }, { status: 502 })

    const match = accounts.data.find((a) => a.platform === bridgePlatform)
    if (!match) {
      // Nothing on the bridge to revoke — still clear our row so the two agree. The handle goes too:
      // it names an account we no longer publish to, and leaving it would read as "still connected".
      await supabase
        .from('client_channels')
        .update({ status: 'belum', confirmed_at: null, handle: null, note: 'Tidak ada koneksi di bridge' })
        .eq('client_id', client_id).eq('platform', platform.toLowerCase())
      return NextResponse.json({ ok: true, disconnected: false, note: 'Akun tidak ada di bridge' })
    }

    const res = await disconnectAccount(key, match.id)
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 502 })

    // Only after the bridge confirms do we drop our own status — never optimistically.
    await supabase
      .from('client_channels')
      .update({ status: 'belum', confirmed_at: null, handle: null, note: 'Terputus dari bridge' })
      .eq('client_id', client_id).eq('platform', platform.toLowerCase())

    return NextResponse.json({ ok: true, disconnected: true, account: match.username })
  }

  const projects = await listProjects(key)
  if (!projects.ok) return NextResponse.json({ error: projects.error }, { status: 502 })

  // One project per client: prefer a project named after the client, else the first one.
  const { data: client } = await supabase
    .from('clients').select('name').eq('id', client_id).maybeSingle()
  const wanted = (client?.name ?? '').toLowerCase()
  const project =
    projects.data.find((p) => p.name?.toLowerCase() === wanted) ?? projects.data[0]

  if (!project) {
    return NextResponse.json(
      { error: 'Belum ada project di WoopSocial. Buat project dulu di dashboard bridge.' },
      { status: 400 }
    )
  }

  const url = await generateOAuthUrl(key, project.id, bridgePlatform, redirect_url || undefined)
  if (!url.ok) return NextResponse.json({ error: url.error }, { status: 502 })

  // Record that we handed out a URL — the account becomes 'terhubung' only after the bridge
  // confirms it (never optimistically, so the UI cannot claim a connection that isn't there).
  await supabase
    .from('client_channels')
    .upsert(
      {
        client_id,
        platform: platform.toLowerCase(),
        status: 'belum',
        note: 'Menunggu otorisasi di browser',
        confirmed_at: null,
      },
      { onConflict: 'client_id,platform' }
    )

  return NextResponse.json({ ok: true, url: url.data.url, project: project.name })
}
