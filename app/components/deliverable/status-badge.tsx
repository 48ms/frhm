'use client'

import { cn } from '@/lib/utils'
import { Icons } from '@/components/icons'
import type { Icon } from '@/components/icons'

type DeliverableStatus = 'draft' | 'sent' | 'approved' | 'revision_requested'

const statusConfig: Record<
  DeliverableStatus,
  { label: string; icon: Icon; className: string }
> = {
  draft: {
    label: 'Draft',
    icon: Icons.circleDashed,
    className: 'bg-muted text-muted-foreground ring-muted-foreground/20',
  },
  sent: {
    label: 'Terkirim',
    icon: Icons.send,
    className: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-300/25',
  },
  approved: {
    label: 'Disetujui',
    icon: Icons.circleCheck,
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-300/25',
  },
  revision_requested: {
    label: 'Minta Revisi',
    icon: Icons.refresh,
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-300/25',
  },
}

export function StatusBadge({ status, className }: { status: DeliverableStatus; className?: string }) {
  const { label, icon: Icon, className: tone } = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex select-none items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none ring-1 ring-inset',
        tone,
        className
      )}
    >
      <Icon className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
      {label}
    </span>
  )
}

type DeliverableType = 'brief' | 'content' | 'report'

const typeConfig: Record<DeliverableType, { label: string; icon: Icon }> = {
  brief: { label: 'Brief', icon: Icons.post },
  content: { label: 'Konten', icon: Icons.pencil },
  report: { label: 'Laporan', icon: Icons.barChart },
}

export function TypeBadge({ type, className }: { type: DeliverableType; className?: string }) {
  const { label, icon: Icon } = typeConfig[type]
  return (
    <span
      className={cn(
        'inline-flex select-none items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground',
        className
      )}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      {label}
    </span>
  )
}
