'use client'

import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header'
import { ClientStatusBadge } from './client-status-badge'
import type { ClientWithStats } from '../api/types'

export const clientColumns: ColumnDef<ClientWithStats>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama Klien" />
    ),
    cell: ({ row }) => {
      const client = row.original
      return (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-lum-surface-container text-lum-cobalt shadow-inner">
            <Icons.workspace className="size-4" />
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/clients/${client.id}`}
              className="truncate text-sm font-semibold text-lum-on-surface hover:text-lum-cobalt hover:underline transition-colors block"
            >
              {client.name}
            </Link>
            <p className="truncate text-xs text-lum-outline font-medium">
              {client.contact_email ?? 'tanpa email'}
            </p>
          </div>
        </div>
      )
    },
    enableSorting: true,
  },
   {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => <ClientStatusBadge pendingCount={row.original.pendingCount} />,
  },
  {
    accessorKey: 'totalDeliverables',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Deliverable" />
    ),
    cell: ({ row }) => {
      const total = row.original.totalDeliverables
      const pending = row.original.pendingCount
      return (
        <div className="flex items-center gap-2 text-xs font-medium">
          <Icons.post className="size-3.5 text-lum-outline" />
          <span>{total} total</span>
          {pending > 0 && (
            <span className="text-amber-600 dark:text-amber-400 font-semibold">
              ({pending} pending)
            </span>
          )}
        </div>
      )
    },
    enableSorting: true,
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Terdaftar" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.created_at)
      return (
        <span className="text-xs text-lum-outline font-medium tabular-nums">
          {date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      )
    },
    enableSorting: true,
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const client = row.original
      return (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/admin/clients/${client.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 rounded-full text-xs font-semibold border-lum-outline-variant/40 hover:border-lum-cobalt/50 hover:text-lum-cobalt transition-colors"
            >
              Kelola <Icons.chevronRight className="size-3" />
            </Button>
          </Link>
        </div>
      )
    },
  },
]
