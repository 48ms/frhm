import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@/lib/supabase/client'
import { ScheduledPost } from './types'

export const calendarKeys = {
  all: ['scheduled-posts'] as const,
  lists: () => [...calendarKeys.all, 'list'] as const,
  list: (clientId: string) => [...calendarKeys.lists(), clientId] as const,
}

export async function fetchScheduledPosts(
  supabase: SupabaseClient,
  clientId: string
): Promise<ScheduledPost[]> {
  let query = supabase
    .from('scheduled_posts')
    .select('*, deliverables(title, type, status)')
    .order('scheduled_at', { ascending: true })

  if (clientId) {
    query = query.eq('client_id', clientId)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as ScheduledPost[]
}

/**
 * Query options for a client's scheduled posts.
 *
 * `customSupabase` lets the server pass its own request-scoped Supabase client
 * during prefetch/dehydration, matching the key the browser will look up.
 */
export function scheduledPostsQueryOptions(
  clientId: string,
  customSupabase?: SupabaseClient
) {
  return queryOptions({
    queryKey: calendarKeys.list(clientId),
    queryFn: () => {
      const supabase = customSupabase ?? createClient()
      return fetchScheduledPosts(supabase, clientId)
    },
    staleTime: 60 * 1000,
  })
}
