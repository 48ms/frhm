'use client'

import { useEffect, useState } from 'react'
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query'
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs'
import { clientsListQueryOptions, clientKeys } from '../api/queries'
import { clientColumns } from './client-table-columns'
import { ClientCardGrid } from './client-card-grid'
import { DataTable } from '@/components/ui/table/data-table'
import { useDataTable } from '@/hooks/use-data-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Icons } from '@/components/icons'
import { useCreateClient } from '@/components/client/create-client-provider'
import { useDebouncedCallback } from '@/hooks/use-debounced-callback'
import { getSortingStateParser } from '@/lib/parsers'
import type { ExtendedColumnSort } from '@/types/data-table'
import type { ClientWithStats } from '../api/types'

export function ClientListing() {
  const queryClient = useQueryClient()
  const { openCreateClient } = useCreateClient()

  // URL state synchronization via nuqs (shallow: true)
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    parseAsString.withDefault('').withOptions({ shallow: true })
  )
  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
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
  // Sort lives in the URL as a JSON array of { id, desc } — the same shape
  // useDataTable writes via getSortingStateParser. It feeds BOTH the table
  // (manualSorting) and the query, so clicking a header actually re-fetches.
  const [sort] = useQueryState(
    'sort',
    getSortingStateParser<ClientWithStats>()
      .withOptions({ shallow: true })
      .withDefault([] as ExtendedColumnSort<ClientWithStats>[])
  )

  const [searchValue, setSearchValue] = useState(searchQuery)

  useEffect(() => {
    setSearchValue(searchQuery)
  }, [searchQuery])

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  // Listen to client:created events for instant cache invalidation
  useEffect(() => {
    const handleCreated = () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all })
    }
    window.addEventListener('client:created', handleCreated)
    return () => window.removeEventListener('client:created', handleCreated)
  }, [queryClient])

  // TanStack React Query with Suspense (0 loading flash on SSR)
  const { data } = useSuspenseQuery(
    clientsListQueryOptions({
      page,
      perPage,
      search: searchQuery,
      status: statusFilter,
      sort,
    })
  )

  const { table } = useDataTable({
    data: data.data,
    columns: clientColumns,
    pageCount: data.pageCount,
    getRowId: (row) => row.id,
    initialState: {
      pagination: {
        pageIndex: page - 1,
        pageSize: perPage,
      },
    },
  })

  const debouncedSetSearch = useDebouncedCallback((val: string | null) => {
    void setSearchQuery(val)
    void setPage(1)
  }, 250)

  const hasFilter = Boolean(searchQuery) || statusFilter !== 'all'

  return (
    <div className="flex flex-col gap-5">
      {/* Filter and View Mode Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-lum-outline" />
            <Input
              placeholder="Cari nama atau email klien..."
              value={searchValue}
              onChange={(e) => {
                const val = e.target.value || null
                setSearchValue(val || '')
                debouncedSetSearch(val)
              }}
              className="h-9 rounded-full border-lum-outline-variant/40 bg-lum-surface-lowest/80 pl-9 text-xs text-lum-on-surface placeholder:text-lum-outline/70 focus-visible:border-lum-cobalt focus-visible:ring-lum-cobalt/20 sm:text-sm"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => {
                  setSearchValue('')
                  void setSearchQuery(null)
                  void setPage(1)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lum-outline hover:text-lum-on-surface p-0.5"
                aria-label="Hapus pencarian"
              >
                <Icons.close className="size-3.5" />
              </button>
            )}
          </div>

          <div className="inline-flex rounded-full border border-lum-outline-variant/40 bg-lum-surface-high/60 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all')
                setPage(1)
              }}
              className={`px-3 py-1 rounded-full transition-all ${
                statusFilter === 'all'
                  ? 'bg-lum-surface-lowest text-lum-on-surface shadow-sm font-bold'
                  : 'text-lum-outline hover:text-lum-on-surface'
              }`}
            >
              Semua ({data.totalAll})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('pending')
                setPage(1)
              }}
              className={`px-3 py-1 rounded-full transition-all ${
                statusFilter === 'pending'
                  ? 'bg-lum-surface-lowest text-lum-on-surface shadow-sm font-bold'
                  : 'text-lum-outline hover:text-lum-on-surface'
              }`}
            >
              Menunggu Persetujuan ({data.pendingAll})
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ready')
                setPage(1)
              }}
              className={`px-3 py-1 rounded-full transition-all ${
                statusFilter === 'ready'
                  ? 'bg-lum-surface-lowest text-lum-on-surface shadow-sm font-bold'
                  : 'text-lum-outline hover:text-lum-on-surface'
              }`}
            >
              Siap Kerja ({data.readyAll})
            </button>
          </div>
        </div>

        {/* View Switcher: Table vs Cards */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          <div className="inline-flex rounded-full border border-lum-outline-variant/40 bg-lum-surface-high/60 p-1">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className="size-7 rounded-full"
              onClick={() => setViewMode('table')}
              title="Tampilan Tabel"
            >
              <Icons.forms className="size-3.5" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="size-7 rounded-full"
              onClick={() => setViewMode('grid')}
              title="Tampilan Kartu"
            >
              <Icons.kanban className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Cards or Empty State */}
      {data.data.length === 0 ? (
        <Card className="rounded-2xl border border-white/80 bg-lum-surface-lowest/85 backdrop-blur-xl shadow-sm">
          <CardContent className="py-16 text-center flex flex-col items-center justify-center">
            <div className="size-14 rounded-full bg-lum-surface-container flex items-center justify-center mb-4 shadow-inner">
              <Icons.workspace className="size-7 text-lum-outline/60" />
            </div>
            <p className="font-display font-bold text-lum-on-surface mb-2">
              {hasFilter
                ? 'Tidak ada klien yang cocok dengan filter pencarian.'
                : 'Belum ada klien terdaftar.'}
            </p>
            {hasFilter ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 rounded-full border-lum-outline-variant/40 text-lum-on-surface hover:bg-lum-surface-container"
                onClick={() => {
                  setSearchQuery(null)
                  setStatusFilter('all')
                  setPage(1)
                }}
              >
                Reset Filter
              </Button>
            ) : (
              <Button
                className="mt-2 rounded-full bg-lum-cobalt text-white hover:bg-lum-cobalt-light"
                onClick={openCreateClient}
              >
                <Icons.add className="size-4 mr-2" /> Buat Klien Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <ClientCardGrid clients={data.data} />
      ) : (
        <DataTable table={table} />
      )}
    </div>
  )
}
