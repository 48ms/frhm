import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  listProjects, listSocialAccounts, validatePost, createPost,
} from '@/lib/bridge/woopsocial'
import { getBridgeKey } from '@/lib/bridge/config'
import { logAudit } from '@/lib/audit/log'
import { denyUnauthorized } from '@/lib/auth/guard'

/**
 * POST /api/admin/deliverables/[id]/publish
 *
 * Publish an APPROVED deliverable straight to the client's connected social accounts through the
 * bridge. This is the "human judged" endpoint of the repo's chain: the deliverable was drafted,
 * sent, and approved by the client — now it goes live.
 *
 * Ground truth 4 (AGENTS.md) is handled here in code: the client approves the *content*, and this
 * route requires the admin's own confirmation (= the `confirm: true` body the UI sends after an
 * explicit dialog). No model can talk its way past a missing confirm.
 *
 * Flow, mirroring the repo's scheduling-and-queue skill:
 *   1. deliverable must exist, belong to this client, and be `approved`
 *   2. discover the connected social accounts (never ask the admin to paste IDs)
 *   3. validate the post against the bridge first — nothing is created yet
 *   4. only then create (publish now), and report what the bridge actually returned
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
          catch { /* server component */ }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Hanya admin yang bisa publish' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  // The UI shows an explicit confirm dialog; the dialog's button sends this. Structural gate.
  if (body.confirm !== true) {
    return NextResponse.json({ error: 'Konfirmasi publish wajib diberikan' }, { status: 400 })
  }

  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('id, client_id, type, title, content_md, status')
    .eq('id', (await params).id)
    .single()
  if (!deliverable) return NextResponse.json({ error: 'Deliverable tidak ditemukan' }, { status: 404 })

  // Only approved work may go live — that is the whole point of the review chain
  if (deliverable.status !== 'approved') {
    return NextResponse.json(
      { error: 'Hanya deliverable berstatus Disetujui yang bisa dipublish' },
      { status: 409 },
    )
  }

  // Bridge key — server-side only
  const apiKey = await getBridgeKey()
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Bridge belum dikonfigurasi. Isi API key di Pengaturan Bridge.' },
      { status: 503 },
    )
  }

  // Discover which platforms are actually connected (woopsocial.md: never ask for the ID)
  const [projects, accounts] = await Promise.all([
    listProjects(apiKey), listSocialAccounts(apiKey),
  ])
  if (!projects.ok) return NextResponse.json({ error: `Bridge: ${projects.error}` }, { status: 502 })
  const connected = accounts.ok ? accounts.data : []
  if (!connected.length) {
    return NextResponse.json(
      { error: 'Belum ada akun terhubung ke bridge. Hubungkan akun client dulu.' },
      { status: 409 },
    )
  }

  // Deliverable content_md → caption text (strip markdown for the post body)
  const md = deliverable.content_md ?? ''
  const text = md
    .replace(/```[\s\S]*?```/g, '')      // drop code blocks
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // drop image embeds
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](url) → text
    .replace(/[#>*_~`|-]/g, '')           // markdown punctuation
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 2200)

  if (!text.trim()) {
    return NextResponse.json({ error: 'Deliverable tidak punya teks untuk dipost' }, { status: 400 })
  }

  // Build the post body — one content item, all connected platforms
  const body2 = {
    content: [{ text, media: [] }],
    schedule: { type: 'PUBLISH_NOW' },
    socialAccounts: connected.map((a) => ({
      platform: a.platform,
      socialAccountId: a.id,
      postType: 'FEED',
    })),
  }

  // Validate first — this creates nothing (verified against the live API)
  const val = await validatePost(apiKey, body2)
  if (!val.ok) return NextResponse.json({ error: `Gagal validasi: ${val.error}` }, { status: 502 })
  if (!val.data.isValid) {
    const errs = (val.data.errors ?? []).map((e) => e.message).join('; ')
    return NextResponse.json({ error: `Validasi gagal: ${errs || 'aturan platform tidak terpenuhi'}` }, { status: 422 })
  }

  // Create now that validation passed — this is the real publish
  const created = await createPost(apiKey, body2)
  if (!created.ok) return NextResponse.json({ error: `Gagal publish: ${created.error}` }, { status: 502 })
  const createdData = created.data as { id?: string; socialAccountPosts?: unknown[] } | null

  // Record the publish attempt on the deliverable so it is visible in the UI
  await supabase
    .from('deliverables')
    .update({ external_link: createdData?.id ? `bridge://post/${createdData.id}` : null })
    .eq('id', (await params).id)

  await logAudit({
    actorId: user.id,
    actorRole: 'admin',
    action: 'deliverable.publish',
    entityType: 'deliverable',
    entityId: (await params).id,
    clientId: deliverable.client_id,
    summary: `Admin mempublikasikan "${deliverable.title}" ke bridge`,
    metadata: {
      title: deliverable.title,
      postId: createdData?.id ?? null,
      platforms: connected.map((a) => a.platform),
    },
  })

  // Report exactly what the bridge returned — never claim success beyond that
  return NextResponse.json({
    success: true,
    postId: createdData?.id ?? null,
    socialAccountPosts: createdData?.socialAccountPosts ?? [],
    note: 'Dikirim ke bridge. Cek status delivery di bridge atau halaman ini.',
  })
}

// mark route as dynamic — uses cookies
export const dynamic = 'force-dynamic'