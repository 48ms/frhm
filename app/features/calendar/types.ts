export type ScheduledPost = {
  id: string
  client_id: string
  deliverable_id: string | null
  title: string
  content: string
  platform: string
  scheduled_at: string
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled'
  notes: string | null
  is_reserved: boolean
  is_placeholder: boolean
  reserved_for: string | null
  reserved_until: string | null
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  campaign_tag?: string | null
  production_id?: string | null
  skill_output_id?: string | null
  deliverables?: { title: string; type: string; status: string } | null
}

export type PlatformInfo = {
  id: string
  name: string
  color: string
}

/** Mutable columns of a scheduled post that clients are allowed to update. */
export type ScheduledPostUpdate = Partial<
  Pick<
    ScheduledPost,
    | 'title'
    | 'content'
    | 'platform'
    | 'scheduled_at'
    | 'status'
    | 'notes'
    | 'is_reserved'
    | 'is_placeholder'
    | 'reserved_for'
    | 'reserved_until'
    | 'priority'
    | 'campaign_tag'
  >
>

export const PLATFORMS: Record<string, { name: string; color: string; bg: string; icon: string }> = {
  instagram: { name: 'Instagram', color: 'text-pink-600', bg: 'bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600', icon: 'photo_camera' },
  tiktok: { name: 'TikTok', color: 'text-neutral-900 dark:text-neutral-100', bg: 'bg-[hsl(var(--admin-on-surface))]', icon: 'music_note' },
  linkedin: { name: 'LinkedIn', color: 'text-blue-600', bg: 'bg-[hsl(var(--admin-cobalt))]', icon: 'work' },
  youtube: { name: 'YouTube', color: 'text-red-600', bg: 'bg-[#ba1a1a]', icon: 'smart_display' },
  facebook: { name: 'Facebook', color: 'text-blue-700', bg: 'bg-[hsl(var(--admin-cobalt))]', icon: 'thumb_up' },
  x: { name: 'Twitter / X', color: 'text-neutral-900 dark:text-neutral-100', bg: 'bg-[hsl(var(--admin-on-surface))]', icon: 'twitter' },
}

export const STATUS_DOT: Record<string, Record<string, string>> = {
  instagram: { published: 'bg-pink-500', scheduled: 'bg-pink-400', draft: 'bg-pink-300', failed: 'bg-red-500', cancelled: 'bg-neutral-400' },
  tiktok: { published: 'bg-neutral-800 dark:bg-neutral-200', scheduled: 'bg-neutral-600', draft: 'bg-neutral-400', failed: 'bg-red-500', cancelled: 'bg-neutral-400' },
  linkedin: { published: 'bg-blue-600', scheduled: 'bg-blue-500', draft: 'bg-blue-300', failed: 'bg-red-500', cancelled: 'bg-neutral-400' },
  youtube: { published: 'bg-red-600', scheduled: 'bg-red-500', draft: 'bg-red-300', failed: 'bg-red-500', cancelled: 'bg-neutral-400' },
  facebook: { published: 'bg-blue-700', scheduled: 'bg-blue-600', draft: 'bg-blue-400', failed: 'bg-red-500', cancelled: 'bg-neutral-400' },
  x: { published: 'bg-neutral-800 dark:bg-neutral-200', scheduled: 'bg-neutral-600', draft: 'bg-neutral-400', failed: 'bg-red-500', cancelled: 'bg-neutral-400' },
}

export const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  published: { label: 'Published', badge: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30', dot: 'bg-green-500' },
  scheduled: { label: 'Terjadwal', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  draft: { label: 'Draft', badge: 'bg-neutral-500/15 text-neutral-700 dark:text-neutral-400 border-neutral-500/30', dot: 'bg-neutral-400' },
  failed: { label: 'Gagal', badge: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30', dot: 'bg-red-500' },
  cancelled: { label: 'Batal', badge: 'bg-neutral-400/15 text-neutral-500 border-neutral-400/30', dot: 'bg-neutral-300' },
}
