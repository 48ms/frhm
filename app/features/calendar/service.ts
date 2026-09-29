'use client'

import { createClient } from '@/lib/supabase/client'
import { ScheduledPost, ScheduledPostUpdate } from '@/features/calendar/types'

/**
 * Service layer for calendar scheduled-posts mutations.
 * Only this file talks to the backend (Supabase) per Frhm architecture rules.
 */

export const calendarService = {
  /**
   * Persistently update a scheduled post's date (via drag-and-drop).
   * Returns the updated row on success.
   */
  async updateScheduledAt(postId: string, scheduledAt: string): Promise<ScheduledPost> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update({ scheduled_at: scheduledAt })
      .eq('id', postId)
      .select('*')
      .single()

    if (error) throw error
    return data as ScheduledPost
  },

  /**
   * Optimistically move/update a post. Only mutable columns are forwarded so a
   * caller can safely pass a `Partial<ScheduledPost>` without leaking readonly
   * or joined fields (e.g. `deliverables`) into the update payload.
   */
  async movePost(postId: string, updates: ScheduledPostUpdate): Promise<ScheduledPost> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('scheduled_posts')
      .update(updates)
      .eq('id', postId)
      .select('*')
      .single()

    if (error) throw error
    return data as ScheduledPost
  },
}
