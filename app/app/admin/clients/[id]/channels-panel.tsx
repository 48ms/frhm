'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState, EmptyMedia, EmptyTitle, EmptyDescription, EmptyHeader } from '@/components/ui/empty'
import { Icons } from '@/components/icons'
import { toast } from 'sonner'

type Channel = {
  platform: string
  handle: string | null
  status: 'belum' | 'terhubung' | 'gagal'
  note: string | null
  confirmed_at: string | null
}

function statusVariant(status: string) {
  if (status === 'terhubung') return 'ghost' as const
  if (status === 'gagal') return 'destructive' as const
  return 'secondary' as const
}

interface ChannelsPanelProps {
  clientId: string
  channels?: Channel[]
}

/**
 * Channel publish — bridge connection management. Lives in Settings (configuration),
 * not Skills (operation). The platform list is sourced from the brand-profile Channels section.
 */
export function ChannelsPanel({ clientId, channels = [] }: ChannelsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel publish</CardTitle>
        <CardDescription>
          Nama platform dari section Channels di brand-profile. Status dari bridge, bukan centang manual.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        {channels.length === 0 && (
          <EmptyState className="border-0 p-0">
            <EmptyMedia variant="icon">
              <Icons.link />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Belum ada channel</EmptyTitle>
              <EmptyDescription>
                Platform ditentukan dari section Channels di brand-profile. Jalankan
                interview fondasi di tab Skills untuk menetapkannya.
              </EmptyDescription>
            </EmptyHeader>
          </EmptyState>
        )}
        {channels.map((channel, i) => (
          <div key={channel.platform} className={`flex min-h-14 items-center justify-between gap-3 py-2.5 ${i > 0 ? 'border-t' : ''}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium capitalize">{channel.platform}</span>
                <Badge variant={statusVariant(channel.status)}>{channel.status}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {channel.handle ?? 'Handle belum ada'}
                {channel.confirmed_at ? ' · dikonfirmasi bridge' : ''}
              </p>
            </div>
            <Button variant="outline" className="h-11 shrink-0 lg:h-8"
              onClick={async () => {
                try {
                  const res = await fetch(`/api/admin/bridge/connect`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ client_id: clientId, platform: channel.platform }),
                  })
                  const data = await res.json()
                  if (!res.ok) {
                    toast.error(data.error || `HTTP ${res.status}`)
                    return
                  }
                  if (data.url) {
                    window.open(data.url, '_blank', 'noopener,noreferrer')
                    toast('Buka browser baru untuk otorisasi WoopSocial.')
                  } else if (data.connected) {
                    toast.success(`${channel.platform} sudah terhubung.`)
                  }
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Gagal inisiasi koneksi')
                }
              }}>
              {channel.status === 'terhubung' ? 'Cek ulang koneksi' : 'Hubungkan'}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
