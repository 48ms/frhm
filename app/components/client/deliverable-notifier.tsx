'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

/**
 * Realtime notifier for the client area.
 *
 * Listens to status changes on the client's deliverables and triggers a router.refresh()
 * so server-rendered counters (sidebar badge, dashboard stats) update the moment the admin
 * sends something, no manual reload needed.
 */
export function DeliverableNotifier({ clientId }: { clientId: string }) {
  const router = useRouter()

  useEffect(() => {
    if (!clientId) return
    const supabase = createClient()
    const last: Record<string, string> = {}

    const channel = supabase
      .channel(`client-deliverable-watch-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliverables',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          const row = payload.new as { id: string; status: string } | null
          if (row?.status && last[row.id] !== row.status) {
            last[row.id] = row.status
            router.refresh()
          }
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [clientId, router])

  return null
}