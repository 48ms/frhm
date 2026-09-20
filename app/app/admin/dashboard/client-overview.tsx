import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon, LayersIcon, AlertCircleIcon, PlusIcon, ClockIcon, CheckCircle2Icon } from 'lucide-react'

export type ClientSummary = {
  id: string
  name: string
  contact_email: string | null
  /** skills marked selesai for this client */
  doneSkills: number
  /** total skills installed for this client */
  totalSkills: number
  /** deliverables awaiting the client's review */
  awaitingReview: number
  /** deliverables the client asked to revise, needs admin action */
  needsRevision: number
  /** deliverables approved by the client, ready to publish */
  approved: number
  lastActivityAt: string | null
}

/**
 * One panel per client: pipeline progress plus the ONE count that needs action.
 * Revisions are the state that requires admin action, so it's called out.
 */
export function ClientOverview({ clients }: { clients: ClientSummary[] }) {
  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground flex flex-col items-center gap-3 py-12">
          <LayersIcon className="size-8" />
          <p className="text-sm">Belum ada client.</p>
          <Link href="/admin/clients">
            <Button size="sm" className="h-11 lg:h-8">Tambah client</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Per Client</h2>
        <Link href="/admin/clients">
          <Button variant="outline" size="sm" className="h-11 lg:h-8" aria-label="Tambah client">
            <PlusIcon className="size-3.5" /> Tambah client
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {clients.map((c) => {
          const pct = c.totalSkills > 0 ? Math.round((c.doneSkills / c.totalSkills) * 100) : 0
          const needsAction = c.needsRevision > 0
          return (
            <Card key={c.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">{c.name}</CardTitle>
                    <CardDescription className="truncate text-xs">
                      {c.contact_email ?? 'tanpa email'}
                    </CardDescription>
                  </div>
                  {needsAction && (
                    <Badge variant="outline" className="shrink-0 border-orange-500/40 text-orange-600">
                      <AlertCircleIcon className="size-3" />
                      {c.needsRevision} revisi
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progres skill</span>
                    <span className="font-medium">
                      {c.doneSkills}/{c.totalSkills} · {pct}%
                    </span>
                  </div>
                  <div
                    className="bg-muted h-2 w-full overflow-hidden rounded-full"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Progres skill ${c.name}: ${pct}%`}
                  >
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">
                    {c.lastActivityAt
                      ? `Aktif ${new Date(c.lastActivityAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`
                      : 'Belum ada aktivitas'}
                  </span>
                  <Link href={`/admin/clients/${c.id}`}>
                    <Button size="sm" variant="outline" className="h-11 lg:h-8">
                      Buka <ArrowRightIcon className="size-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

/** Small helper for the "needs your attention" strip at the top of the dashboard. */
export function ActionStrip({
  awaitingReview, needsRevision, approved,
}: { awaitingReview: number; needsRevision: number; approved: number }) {
  const items = [
    {
      label: 'Menunggu review client',
      value: awaitingReview,
      cls: 'text-blue-600',
      bg: 'bg-blue-500/10 text-blue-600',
      icon: ClockIcon,
    },
    {
      label: 'Perlu revisi dari kamu',
      value: needsRevision,
      cls: needsRevision > 0 ? 'text-orange-600' : 'text-muted-foreground',
      bg: needsRevision > 0 ? 'bg-orange-500/10 text-orange-600' : 'bg-muted text-muted-foreground',
      icon: AlertCircleIcon,
    },
    {
      label: 'Disetujui, siap publish',
      value: approved,
      cls: approved > 0 ? 'text-emerald-600' : 'text-muted-foreground',
      bg: approved > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground',
      icon: CheckCircle2Icon,
    },
  ]
  return (
    <Card>
      <CardContent className="grid gap-4 p-4 sm:grid-cols-3">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <div key={it.label} className="flex items-center gap-3">
              <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${it.bg}`}>
                <Icon className="size-4" />
              </div>
              <div>
                <p className={`text-xl font-bold ${it.cls}`}>{it.value}</p>
                <p className="text-muted-foreground text-xs">{it.label}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}