'use client'

import { useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Icons, type Icon } from '@/components/icons'
import type { AuditRow } from './page'

// Icons chosen for their literal meaning: rocket = publish/ship, send = deliver,
// check = approve, message = revision request, key = password reset, user+ = create,
// play = bulk run. A generic action falls back to Icons.history (a timeline mark).
const ACTION_ICONS: Record<string, Icon> = {
  'deliverable.publish': Icons.rocket,
  'deliverable.send': Icons.send,
  'deliverable.approve': Icons.circleCheck,
  'deliverable.revision_request': Icons.messageSquare,
  'client.reset_password': Icons.keyRound,
  'client.create': Icons.userPlus,
  'skill.bulk_run': Icons.playCircle,
}

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

interface AuditLogListProps {
  rows: AuditRow[]
  clientNames: Record<string, string>
  actionOptions: [action: string, count: number][]
  totalAll: number
  total: number
  page: number
  pageSize: number
  currentAction: string
  query: string
}

export function AuditLogList({
  rows, clientNames, actionOptions, totalAll, total, page, pageSize, currentAction, query,
}: AuditLogListProps) {
  const pathname = usePathname()
  const formRef = useRef<HTMLFormElement>(null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  function pageHref(target: number) {
    const params = new URLSearchParams()
    if (currentAction !== 'all') params.set('action', currentAction)
    if (query) params.set('q', query)
    if (target > 1) params.set('page', String(target))
    const qs = params.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }

  return (
    <div className="space-y-4">
      {/* Filters: one GET form, so it works without JS and resets to page 1 on submit.
          The select is used because the table carries many distinct actions (30+),
          which would not fit as chips. */}
      <form
        ref={formRef}
        method="get"
        action={pathname}
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="audit-action" className="sr-only">Filter jenis aktivitas</label>
          <select
            id="audit-action"
            name="action"
            defaultValue={currentAction}
            onChange={() => formRef.current?.requestSubmit()}
            className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 lg:h-9"
          >
            <option value="all">Semua aktivitas ({totalAll})</option>
            {actionOptions.map(([action, count]) => (
              <option key={action} value={action}>
                {action} ({count})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="relative w-full sm:w-72">
            <Icons.search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Cari ringkasan atau pelaku…"
              className="h-11 pl-8 rounded-xl lg:h-9"
              aria-label="Cari ringkasan atau pelaku"
            />
          </div>
        </div>
      </form>

      {/* Count summary: states the active filter and whether a search is narrowing results */}
      <p className="text-muted-foreground text-xs">
        {total} aktivitas
        {currentAction !== 'all' ? ` pada aksi "${currentAction}"` : ''}
        {query ? ` cocok dengan "${query}"` : ''}
        {total > 0 ? ` · halaman ${page} dari ${totalPages}` : ''}
      </p>

      {rows.length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="text-muted-foreground flex flex-col items-center gap-3 py-12 text-sm">
            {totalAll === 0 ? (
              <>
                <Icons.history className="size-8" />
                <p>Belum ada aktivitas tercatat.</p>
              </>
            ) : (
              <>
                <Icons.alertCircle className="size-8" />
                <p>Tidak ada aktivitas yang cocok dengan filter ini.</p>
                <Link
                  href={pathname}
                  className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Bersihkan filter
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border">
          <CardContent className="p-0">
            <div className="divide-y">
              {rows.map((r) => {
                const client = r.client_id ? clientNames[r.client_id] : null
                const Icon = ACTION_ICONS[r.action] ?? Icons.history
                return (
                  <div key={r.id} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="gap-1.5 h-6 px-2 text-xs">
                          <Icon className="size-3" />
                          {r.action}
                        </Badge>
                        {client && <Badge variant="secondary" className="h-6 px-2 text-xs">{client}</Badge>}
                      </div>
                      <p className="text-sm">{r.summary}</p>
                      <p className="text-muted-foreground text-xs">
                        {r.actor_name || (r.actor_role === 'admin' ? 'Admin' : r.actor_role === 'client' ? 'Klien' : 'Sistema')}
                        {' · '}
                        {fmtWhen(r.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-between gap-4" aria-label="Navigasi halaman">
          <p className="text-muted-foreground text-xs">
            Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari {total}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={pageHref(page - 1)}
                rel="prev"
                className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Sebelumnya
              </Link>
            ) : (
              <span aria-disabled="true" className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium opacity-50">
                Sebelumnya
              </span>
            )}
            <span className="text-muted-foreground text-xs tabular-nums">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={pageHref(page + 1)}
                rel="next"
                className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Selanjutnya
              </Link>
            ) : (
              <span aria-disabled="true" className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium opacity-50">
                Selanjutnya
              </span>
            )}
          </div>
        </nav>
      )}
    </div>
  )
}
