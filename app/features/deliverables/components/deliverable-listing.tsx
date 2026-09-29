'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { DataTable } from '@/components/ui/table/data-table'
import { useDataTable } from '@/hooks/use-data-table'
import { deliverablesListQueryOptions } from '@/features/deliverables/api/queries'
import { deliverableColumns } from './deliverable-table-columns'

export function DeliverableListing() {
  const router = useRouter()

  // URL state sync via nuqs (shallow: true)
  const [status, setStatus] = useQueryState(
    'status',
    parseAsString.withDefault('all').withOptions({ shallow: true })
  )
  const [type, setType] = useQueryState(
    'type',
    parseAsString.withDefault('all').withOptions({ shallow: true })
  )
  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ shallow: true })
  )
  const [perPage] = useQueryState(
    'perPage',
    parseAsInteger.withDefault(10).withOptions({ shallow: true })
  )
  const [clientId, setClientId] = useQueryState(
    'client',
    parseAsString.withDefault('').withOptions({ shallow: true })
  )

  // TanStack React Query with Suspense (zero loading flash on SSR)
  const { data } = useSuspenseQuery(
    deliverablesListQueryOptions({
      status: status === 'all' ? undefined : status,
      type: type === 'all' ? undefined : type,
      page,
      pageSize: perPage,
      clientId: clientId || undefined,
    })
  )

  const { table } = useDataTable({
    data,
    columns: deliverableColumns,
    pageCount: Math.ceil(data.length / perPage),
    getRowId: (row) => row.id,
    initialState: {
      pagination: {
        pageIndex: page - 1,
        pageSize: perPage,
      },
    },
  })

  const isFiltered = status !== 'all' || type !== 'all'
  const hasActiveClientFilter = !!clientId

  return (
    <div data-slot="card" className="p-6 lg:p-8">
      {/* Filter and view mode toolbar */}
      <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="inline-flex rounded-full border border-[hsl(var(--admin-outline-variant))]/30 bg-[hsl(var(--admin-surface-high))]/70 p-1 text-xs font-bold uppercase tracking-widest text-[hsl(var(--admin-outline))]">
            {[
              { value: 'all', label: 'Semua' },
              { value: 'draft', label: 'Draft' },
              { value: 'sent', label: 'Terkirim' },
              { value: 'approved', label: 'Disetujui' },
              { value: 'revision_requested', label: 'Revisi' },
            ].map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { setStatus(o.value); setPage(1) }}
                className={`rounded-full px-4 py-1.5 transition-all ${
                  status === o.value
                    ? 'bg-[hsl(var(--admin-surface-lowest))] text-[hsl(var(--admin-on-surface))] shadow-sm'
                    : 'hover:text-[hsl(var(--admin-on-surface))]'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-full border border-[hsl(var(--admin-outline-variant))]/30 bg-[hsl(var(--admin-surface-high))]/70 p-1 text-xs font-bold uppercase tracking-widest text-[hsl(var(--admin-outline))]">
            {[
              { value: 'all', label: 'Semua Tipe' },
              { value: 'brief', label: 'Brief' },
              { value: 'content', label: 'Konten' },
              { value: 'report', label: 'Laporan' },
            ].map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => { setType(o.value); setPage(1) }}
                className={`rounded-full px-4 py-1.5 transition-all ${
                  type === o.value
                    ? 'bg-[hsl(var(--admin-surface-lowest))] text-[hsl(var(--admin-on-surface))] shadow-sm'
                    : 'hover:text-[hsl(var(--admin-on-surface))]'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <Button
            onClick={() => router.push('/admin/deliverables/new')}
            className="rounded-full bg-[hsl(var(--admin-cobalt))] px-5 font-syne font-bold uppercase tracking-[0.12em] text-white hover:bg-[hsl(var(--admin-cobalt-fixed-foreground))]"
          >
            <Icons.add className="size-4 mr-2" /> Deliverable Baru
          </Button>
        </div>
      </div>


      {/* Client filter chip */}
      {hasActiveClientFilter && (
        <button
          type="button"
          onClick={() => setClientId('')}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--admin-cobalt))]/30 bg-[hsl(var(--admin-cobalt-fixed))]/60 px-3 py-1.5 font-syne text-xs font-bold text-[hsl(var(--admin-cobalt))] transition-colors hover:bg-[hsl(var(--admin-cobalt-fixed))] self-start"
        >
          <Icons.user className="size-3.5" />
          Filter klien aktif (klik untuk reset)
          <Icons.close className="size-3.5" />
        </button>
      )}

      {/* Main content: table or empty state */}
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-[hsl(var(--admin-outline))]">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[hsl(var(--admin-surface-high))]/60 shadow-sm">
            <Icons.page className="size-7 text-[hsl(var(--admin-outline))]" />
          </div>
          <p className="font-syne font-bold text-[hsl(var(--admin-on-surface))]">
            {isFiltered
              ? 'Tidak ada deliverable yang cocok dengan filter.'
              : 'Belum ada deliverable.'}
          </p>
          {isFiltered ? (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-[hsl(var(--admin-outline-variant))]/40 font-syne font-bold uppercase tracking-wider"
              onClick={() => { setStatus('all'); setType('all') }}
            >
              Reset Filter
            </Button>
          ) : (
            <Button
              className="rounded-full bg-[hsl(var(--admin-cobalt))] px-5 font-syne font-bold uppercase tracking-[0.12em] text-white hover:bg-[hsl(var(--admin-cobalt-fixed-foreground))]"
              onClick={() => router.push('/admin/deliverables/new')}
            >
              <Icons.add className="size-4 mr-2" /> Buat Deliverable Pertama
            </Button>
          )}
        </div>
      ) : (
        <DataTable table={table} />
      )}
    </div>
  )
}