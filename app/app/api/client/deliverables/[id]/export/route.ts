import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

const TYPE_LABEL: Record<string, string> = {
  brief: 'Brief',
  content: 'Konten',
  report: 'Laporan',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draf',
  sent: 'Menunggu Review',
  approved: 'Disetujui',
  revision_requested: 'Revisi Diminta',
  published: 'Sudah Tayang',
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

/**
 * Renders one deliverable as a self-contained Markdown document the client can
 * download and keep. Read-only: no side effects, no writes.
 */
function toMarkdown(d: Record<string, unknown>, comments: Record<string, unknown>[], clientName: string) {
  const title = String(d.title ?? 'Deliverable')
  const type = TYPE_LABEL[String(d.type)] ?? String(d.type ?? '-')
  const status = STATUS_LABEL[String(d.status)] ?? String(d.status ?? '-')
  const lines: string[] = [
    `# ${title}`,
    '',
    `**Klien:** ${clientName}`,
    `**Tipe:** ${type}`,
    `**Status:** ${status}`,
    `**Dikirim:** ${fmtDate(d.sent_at as string)}`,
    `**Terakhir diubah:** ${fmtDate(d.updated_at as string)}`,
    '',
    '---',
    '',
  ]

  const content = (d.content_md as string) ?? ''
  lines.push(content.trim() ? content : '_Tidak ada konten._')

  if (d.external_link) {
    lines.push('', '---', '', `**Link eksternal:** ${d.external_link}`)
  }

  if (comments.length > 0) {
    lines.push('', '---', '', '## Komentar', '')
    for (const c of comments) {
      const who = String(c.author_name ?? 'Tanpa nama')
      const role = String(c.author_role ?? '')
      const roleLabel = role === 'client' ? 'Klien' : role === 'admin' ? 'Tim' : ''
      const stamp = fmtDate(c.created_at as string)
      lines.push(`**${who}${roleLabel ? ` (${roleLabel})` : ''}** · ${stamp}`, '', String(c.content ?? ''), '')
    }
  }

  lines.push('', '---', '', `_Dokumen ini dibuat otomatis dari Frhm._`)
  return lines.join('\n')
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'deliverable'
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
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

  // deliverables.client_id is clients.id — resolve through users.client_id (same as the page)
  const { data: profile } = await supabase
    .from('users').select('client_id').eq('id', user.id).single()
  if (!profile?.client_id) {
    return NextResponse.json({ error: 'Akun ini tidak terhubung ke client mana pun' }, { status: 403 })
  }

  const { data: deliverable } = await supabase
    .from('deliverables')
    .select('id, title, type, status, content_md, external_link, sent_at, updated_at, client_id')
    .eq('id', id)
    .eq('client_id', profile.client_id)
    .maybeSingle()

  if (!deliverable) {
    return NextResponse.json({ error: 'Deliverable tidak ditemukan' }, { status: 404 })
  }

  const [{ data: client }, { data: comments }] = await Promise.all([
    supabase.from('clients').select('name').eq('id', profile.client_id).single(),
    supabase
      .from('deliverable_comments')
      .select('content, created_at, author_name, author_role')
      .eq('deliverable_id', id)
      .order('created_at', { ascending: true }),
  ])

  const md = toMarkdown(
    deliverable as Record<string, unknown>,
    (comments ?? []) as Record<string, unknown>[],
    client?.name ?? 'Klien',
  )

  const filename = `${slugify(String(deliverable.title))}.md`
  return new NextResponse(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
