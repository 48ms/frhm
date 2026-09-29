import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query-client'
import { createClient } from '@/lib/supabase/server'
import { scheduledPostsQueryOptions } from '@/features/calendar/queries'
import { AdminCalendarClient } from './calendar-client'

export const dynamic = 'force-dynamic'

export default async function AdminCalendarPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .order('name')

  // Prefetch the first client's posts so the client's useQuery finds a warm
  // cache entry on first paint (key must match the client's default selection).
  const queryClient = getQueryClient()
  const defaultClientId = clients?.[0]?.id ?? ''
  void queryClient.prefetchQuery(scheduledPostsQueryOptions(defaultClientId, supabase))

  return (
    <div className="space-y-6">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AdminCalendarClient clients={clients ?? []} />
      </HydrationBoundary>
    </div>
  )
}
