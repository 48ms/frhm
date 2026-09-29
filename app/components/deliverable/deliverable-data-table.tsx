'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import Link from 'next/link'
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DataTableColumnHeader,
  DataTableViewOptions,
} from '@/components/ui/table'
import { DataTablePagination } from '@/components/ui/table/data-table-pagination'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StatusBadge, TypeBadge } from '@/components/deliverable/status-badge'
import type { DeliverableWithClient } from '@/features/deliverables/api/types'

export function DeliverableDataTable({
  data,
}: {
  data: DeliverableWithClient[]
}) {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    parseAsString.withDefault('').withOptions({ shallow: true })
  )
  const [pageIndex, setPageIndex] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ shallow: true })
  )

  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState(searchQuery)

  useEffect(() => {
    setGlobalFilter(searchQuery)
  }, [searchQuery])

  const columns = useMemo<ColumnDef<DeliverableWithClient>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Judul" />
        ),
        cell: ({ row }) => (
          <Link
            href={`/admin/deliverables/${row.original.id}`}
            className="font-medium text-primary hover:underline text-xs sm:text-sm"
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        accessorKey: 'type',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Tipe" />
        ),
        cell: ({ row }) => <TypeBadge type={row.original.type} />,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'clients.name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Client" />
        ),
        cell: ({ row }) => row.original.clients?.name || '—',
      },
      {
        accessorKey: 'updated_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Diupdate" />
        ),
        cell: ({ row }) =>
          new Date(row.original.updated_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination: {
        pageIndex: Math.max(0, pageIndex - 1),
        pageSize: 10,
      },
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: (val) => {
      setGlobalFilter(String(val))
      setSearchQuery(val ? String(val) : null)
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const next = updater({
          pageIndex: Math.max(0, pageIndex - 1),
          pageSize: 10,
        })
        setPageIndex(next.pageIndex + 1)
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2">
          <Input
            placeholder="Cari judul deliverable..."
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value)
              setSearchQuery(e.target.value || null)
            }}
            className="h-9 max-w-sm text-xs sm:text-sm"
          />
          {globalFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setGlobalFilter('')
                setSearchQuery(null)
              }}
              className="h-9 px-2 text-xs"
            >
              Reset
            </Button>
          )}
        </div>
        <DataTableViewOptions table={table} />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-xs sm:text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground text-xs"
                >
                  Tidak ada deliverable yang cocok.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} pageSizeOptions={[5, 10, 20, 50]} />
    </div>
  )
}