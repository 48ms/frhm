import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

const TYPE_LABEL: Record<string, string> = {
  brief: 'Brief', content: 'Konten', report: 'Laporan',
}
const STATUS_LABEL: Record<string, string> = {
  draft: 'Draf', sent: 'Menunggu Review', approved: 'Disetujui',
  revision_requested: 'Revisi Diminta', published: 'Sudah Tayang',
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * GET /api/admin/clients/[id]/export
 *
 * Exports every deliverable of one client as a single Markdown bundle, so the admin can hand
 * the whole history to the client (or keep it as an archive) without opening each item.
 * Admin-only: RLS plus an explicit role check. Read-only.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: clientId } = await params
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(list) {
          try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) }
          catch { /* server component */ }
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return denyForbidden()
  }

  const [{ data: client }, { data: deliverables }] = await Promise.all([
    supabase.from('clients').select('name').eq('id', clientId).single(),
    supabase
      .from('deliverables')
      .select('id, title, type, status, content_md, external_link, sent_at, updated_at')
      .eq('client_id', clientId)
      .order('updated_at', { ascending: false }),
  ])

  if (!client) return NextResponse.json({ error: 'Client tidak ditemukan' }, { status: 404 })

  const rows = deliverables ?? []
  const today = fmtDate(new Date().toISOString())
  const out: string[] = [
    `# Deliverable: ${client.name}`,
    '',
    `_Diekspor ${today} · ${rows.length} deliverable_`,
    '',
  ]

  if (rows.length > 0) {
    out.push('## Daftar Isi', '')
    rows.forEach((d, i) => {
      out.push(`${i + 1}. ${d.title} · ${TYPE_LABEL[d.type] ?? d.type} (${STATUS_LABEL[d.status] ?? d.status})`)
    })
  }

  for (const d of rows) {
    out.push('', '---', '', `## ${d.title}`, '')
    out.push(
      `**Tipe:** ${TYPE_LABEL[d.type] ?? d.type}  `,
      `**Status:** ${STATUS_LABEL[d.status] ?? d.status}  `,
      `**Dikirim:** ${fmtDate(d.sent_at)}  `,
      `**Terakhir diubah:** ${fmtDate(d.updated_at)}`,
      '',
    )
    const content = (d.content_md ?? '').trim()
    out.push(content || '_Tidak ada konten._')
    if (d.external_link) out.push('', `**Link eksternal:** ${d.external_link}`)
  }

  out.push('', '---', '', '_Dokumen ini dibuat otomatis dari Frhm._')

  const slug = client.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'client'
  const stamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(out.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="deliverable-${slug}-${stamp}.md"`,
      'Cache-Control': 'no-store',
    },
  })
}
