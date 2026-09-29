import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import type { ClientOverviewSummary } from '../api/types'

export type ClientSummary = ClientOverviewSummary

export function ClientOverview({ clients }: { clients: ClientOverviewSummary[] }) {
  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="text-muted-foreground flex flex-col items-center gap-3 py-12">
          <Icons.layers className="size-8" />
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
            <Icons.add className="size-3.5" /> Tambah client
          </Button>
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((c) => {
          const hasSkills = c.totalSkills > 0
          const pct = hasSkills ? Math.round((c.doneSkills / c.totalSkills) * 100) : 0
          const hasRevision = c.needsRevision > 0

          return (
            <Card
              key={c.id}
              className={[
                'flex flex-col justify-between transition-colors',
                hasRevision ? 'border-amber-500/40 bg-amber-500/5' : '',
              ].join(' ')}
            >
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {c.contact_email ?? 'tanpa email'}
                    </p>
                  </div>
                  {hasRevision ? (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-500 text-xs shrink-0">
                      <Icons.alertCircle className="mr-1 size-3" />
                      {c.needsRevision} revisi
                    </Badge>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="text-muted-foreground flex items-center justify-between text-xs">
                    <span>Progres skill</span>
                    <span>
                      {hasSkills ? (
                        `${c.doneSkills}/${c.totalSkills} · ${pct}%`
                      ) : (
                        <span className="italic">Belum dikonfigurasi</span>
                      )}
                    </span>
                  </div>
                  <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="text-muted-foreground flex items-center justify-between border-t pt-2 text-xs">
                  <span>
                    {c.lastActivityAt ? (
                      `Aktif ${new Date(c.lastActivityAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}`
                    ) : (
                      'Belum ada aktivitas'
                    )}
                  </span>
                  <Link href={`/admin/clients/${c.id}`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Kelola <Icons.arrowRight className="size-3" />
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

export function ActionStrip({
  awaitingReview,
  needsRevision,
  approved,
}: {
  awaitingReview: number
  needsRevision: number
  approved: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 sm:gap-4 sm:p-4">
      <div className="flex items-center gap-2 text-xs">
        <span className="flex size-6 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
          <Icons.clock className="size-3.5" />
        </span>
        <span className="font-semibold">{awaitingReview}</span>
        <span className="text-muted-foreground">Menunggu review client</span>
      </div>

      <div className="text-muted-foreground/30 hidden sm:block">·</div>

      <div className="flex items-center gap-2 text-xs">
        <span className="flex size-6 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
          <Icons.alertCircle className="size-3.5" />
        </span>
        <span className="font-semibold text-amber-600 dark:text-amber-400">{needsRevision}</span>
        <span className="text-muted-foreground">Perlu revisi dari kamu</span>
      </div>

      <div className="text-muted-foreground/30 hidden sm:block">·</div>

      <div className="flex items-center gap-2 text-xs">
        <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <Icons.circleCheck className="size-3.5" />
        </span>
        <span className="font-semibold">{approved}</span>
        <span className="text-muted-foreground">Disetujui, siap publish</span>
      </div>
    </div>
  )
}
