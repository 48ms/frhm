import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { denyUnauthorized } from '@/lib/auth/guard'

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
 * Bundles every deliverable of the signed-in client into one Markdown file, so the
 * client can archive or hand a report to someone else without clicking each item.
 * Read-only.
 */
export async function GET() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase
    .from('users').select('client_id').eq('id', user.id).single()
  if (!profile?.client_id) {
    return NextResponse.json({ error: 'Akun ini tidak terhubung ke client mana pun' }, { status: 403 })
  }

  const [{ data: client }, { data: deliverables }] = await Promise.all([
    supabase.from('clients').select('name').eq('id', profile.client_id).single(),
    supabase
      .from('deliverables')
      .select('id, title, type, status, content_md, external_link, sent_at, updated_at')
      .eq('client_id', profile.client_id)
      .order('updated_at', { ascending: false }),
  ])

  const rows = deliverables ?? []
  const clientName = client?.name ?? 'Klien'
  const today = fmtDate(new Date().toISOString())

  const out: string[] = [
    `# Deliverable: ${clientName}`,
    '',
    `_Diekspor ${today} · ${rows.length} deliverable_`,
    '',
    '## Daftar Isi',
    '',
  ]
  rows.forEach((d, i) => {
    const label = STATUS_LABEL[d.status] ?? d.status
    out.push(`${i + 1}. ${d.title} · ${TYPE_LABEL[d.type] ?? d.type} (${label})`)
  })

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

  const slug = clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'client'
  const stamp = new Date().toISOString().slice(0, 10)
  return new NextResponse(out.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="deliverable-${slug}-${stamp}.md"`,
      'Cache-Control': 'no-store',
    },
  })
}
