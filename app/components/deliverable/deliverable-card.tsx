'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge, TypeBadge } from './status-badge'
import { cn } from '@/lib/utils'

interface DeliverableCardProps {
  id: string
  title: string
  status: 'draft' | 'sent' | 'approved' | 'revision_requested'
  type: 'brief' | 'content' | 'report'
  clientName?: string
  description?: string
  createdAt: string
  updatedAt?: string
  href: string
  showClient?: boolean
  className?: string
}

export function DeliverableCard({
  id,
  title,
  status,
  type,
  clientName,
  description,
  createdAt,
  updatedAt,
  href,
  showClient = false,
  className,
}: DeliverableCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className={cn('transition-colors hover:bg-muted/50', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base font-semibold line-clamp-1">{title}</CardTitle>
                <div className="flex items-center gap-1">
                  <StatusBadge status={status} />
                  <TypeBadge type={type} />
                </div>
              </div>
              <CardDescription className="flex items-center gap-2 text-xs">
                <span>Dibuat {formattedDate}</span>
                {updatedAt && <span className="text-muted-foreground">• Terakhir diupdate {new Date(updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          )}
          {showClient && clientName && (
            <div className="mt-2 text-xs text-muted-foreground">
              Client: <span className="font-medium">{clientName}</span>
            </div>
          )}
          <div className="mt-4 text-xs text-muted-foreground">
            ID: <code className="rounded bg-muted px-1">{id.slice(0, 8)}...</code>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}