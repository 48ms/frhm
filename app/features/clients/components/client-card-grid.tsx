'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/icons'
import { ClientStatusBadge } from './client-status-badge'
import type { ClientWithStats } from '../api/types'

interface ClientCardGridProps {
  clients: ClientWithStats[]
}

export function ClientCardGrid({ clients }: ClientCardGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clients.map((c) => (
        <Link key={c.id} href={`/admin/clients/${c.id}`} className="block">
          <Card className="h-full rounded-2xl border border-white/80 bg-lum-surface-lowest/85 backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:border-lum-cobalt/40 hover:-translate-y-0.5 group">
            <CardHeader className="pb-3 border-b border-lum-outline-variant/30">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lum-surface-container text-lum-cobalt group-hover:bg-lum-cobalt group-hover:text-white transition-colors duration-300 shadow-inner">
                  <Icons.workspace className="size-5" />
                </div>
                <div className="min-w-0 pt-0.5">
                  <CardTitle className="truncate font-display text-base font-bold text-lum-on-surface group-hover:text-lum-cobalt transition-colors">
                    {c.name}
                  </CardTitle>
                  {c.contact_email && (
                    <CardDescription className="truncate text-xs text-lum-outline">
                      {c.contact_email}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between gap-2">
                <ClientStatusBadge pendingCount={c.pendingCount} />
                <span className="text-[11px] text-lum-outline font-medium flex items-center gap-1">
                  <Icons.post className="size-3 text-lum-outline" />
                  {c.totalDeliverables} item
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
