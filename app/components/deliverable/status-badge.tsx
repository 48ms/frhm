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
    className: 'bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))] ring-[hsl(var(--admin-cobalt))]/20',
  },
  approved: {
    label: 'Disetujui',
    icon: Icons.circleCheck,
    className: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] ring-[hsl(var(--success))]/20',
  },
  revision_requested: {
    label: 'Minta Revisi',
    icon: Icons.refresh,
    className: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] ring-[hsl(var(--warning))]/20',
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
