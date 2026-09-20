'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  RocketIcon, SendIcon, CheckCircle2Icon, MessageSquareIcon, KeyRoundIcon,
  UserPlusIcon, PlayCircleIcon, HistoryIcon, SearchIcon, CircleAlertIcon,
} from 'lucide-react'
import type { AuditRow } from './page'

const ACTION_ICONS: Record<string, typeof RocketIcon> = {
  'deliverable.publish': RocketIcon,
  'deliverable.send': SendIcon,
  'deliverable.approve': CheckCircle2Icon,
  'deliverable.revision_request': MessageSquareIcon,
  'client.reset_password': KeyRoundIcon,
  'client.create': UserPlusIcon,
  'skill.bulk_run': PlayCircleIcon,
}

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'deliverable.publish', label: 'Publish' },
  { key: 'deliverable.send', label: 'Kirim' },
  { key: 'deliverable.approve', label: 'Disetujui' },
  { key: 'deliverable.revision_request', label: 'Revisi' },
] as const

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function ActionBadge({ action, label }: { action: string; label: string }) {
  const Icon = ACTION_ICONS[action] ?? HistoryIcon
  return (
    <Badge variant="outline" className="gap-1.5 h-6 px-2 text-xs">
      <Icon className="size-3" />
      {label}
    </Badge>
  )
}

export function AuditLogList({
  rows, clientNames,
}: {
  rows: AuditRow[]
  clientNames: Record<string, string>
}) {
  const [filter, setFilter] = useState<string>('all')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      if (filter !== 'all' && r.action !== filter) return false
      if (!q) return true
      const client = r.client_id ? clientNames[r.client_id] ?? '' : ''
      return (
        r.summary.toLowerCase().includes(q) ||
        (r.actor_name ?? '').toLowerCase().includes(q) ||
        client.toLowerCase().includes(q)
      )
    })
  }, [rows, filter, query, clientNames])

  if (rows.length === 0) {
    return (
      <Card className="border border-dashed">
        <CardContent className="text-muted-foreground flex flex-col items-center gap-3 py-12">
          <HistoryIcon className="size-8" />
          <p className="text-sm">Belum ada aktivitas tercatat.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border bg-muted/40 p-1" role="group" aria-label="Filter aktivitas">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`min-h-10 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                filter === f.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari aktivitas…"
            className="h-11 pl-8 rounded-xl lg:h-9"
            aria-label="Cari aktivitas"
          />
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        {visible.length} dari {rows.length} aktivitas
      </p>

      {visible.length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
            <CircleAlertIcon className="size-4" />
            Tidak ada aktivitas yang cocok.
          </CardContent>
        </Card>
      ) : (
        <Card className="border">
          <CardContent className="p-0">
            <div className="divide-y">
              {visible.map((r) => {
                const client = r.client_id ? clientNames[r.client_id] : null
                const Icon = ACTION_ICONS[r.action] ?? HistoryIcon
                const label = FILTERS.find(f => f.key === r.action)?.label ?? r.action
                return (
                  <div key={r.id} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <ActionBadge action={r.action} label={label} />
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

      <Separator />
      <p className="text-muted-foreground text-xs">
        Menampilkan maksimal 300 aktivitas terakhir.
      </p>
    </div>
  )
}