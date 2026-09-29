import { ColumnDef } from '@tanstack/react-table'
import { DeliverableWithClient } from '@/features/deliverables/api/types'

export const deliverableColumns: ColumnDef<DeliverableWithClient>[] = [
  {
    accessorKey: 'title',
    header: 'Judul',
    cell: ({ row }) => (
      <div className="font-medium">{row.original.title}</div>
    ),
  },
  {
    accessorKey: 'client',
    header: 'Klien',
    cell: ({ row }) => (
      <div className="text-sm">{row.original.clients?.name ?? '-'}</div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const badgeMap: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-700',
        sent: 'bg-blue-100 text-blue-700',
        approved: 'bg-green-100 text-green-700',
        revision_requested: 'bg-orange-100 text-orange-700',
      }
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeMap[status]}`}>
          {status}
        </span>
      )
    },
  },
  {
    accessorKey: 'type',
    header: 'Tipe',
    cell: ({ row }) => (
      <div className="text-sm">{row.original.type}</div>
    ),
  },
  {
    accessorKey: 'updated_at',
    header: 'Terakhir Diubah',
    cell: ({ row }) => {
      const date = new Date(row.original.updated_at)
      return <div className="text-sm">{date.toLocaleDateString('id-ID')}</div>
    },
  },
]
