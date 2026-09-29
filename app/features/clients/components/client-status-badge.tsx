'use client'

import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'

/**
 * Single source of truth for the client status pill. Used by both the table
 * column and the card grid — previously duplicated, which risked the two
 * views drifting apart.
 *
 * Wording follows the DB contract (migration 028): deliverable status "sent"
 * is "Terkirim ke Client" / awaiting approval, NOT "review".
 */
export function ClientStatusBadge({ pendingCount }: { pendingCount: number }) {
  if (pendingCount > 0) {
    return (
      <Badge
        variant="destructive"
        className="gap-1.5 h-6 px-2 text-[11px] font-medium tracking-wide border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
      >
        <Icons.alertCircle className="size-3" />
        {pendingCount} menunggu persetujuan
      </Badge>
    )
  }

  return (
    <Badge
      variant="secondary"
      className="gap-1.5 h-6 px-2 text-[11px] font-medium tracking-wide bg-lum-surface-container text-lum-cobalt hover:bg-lum-surface-high border-none"
    >
      <Icons.circleCheck className="size-3" />
      Siap dikerjakan
    </Badge>
  )
}
