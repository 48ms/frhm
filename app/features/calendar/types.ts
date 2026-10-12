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
  instagram: { name: 'Instagram', color: 'text-[hsl(var(--platform-instagram))]', bg: 'bg-[hsl(var(--platform-instagram))]', icon: 'photo_camera' },
  tiktok: { name: 'TikTok', color: 'text-[hsl(var(--platform-tiktok))]', bg: 'bg-[hsl(var(--platform-tiktok))]', icon: 'music_note' },
  linkedin: { name: 'LinkedIn', color: 'text-[hsl(var(--platform-linkedin))]', bg: 'bg-[hsl(var(--platform-linkedin))]', icon: 'work' },
  youtube: { name: 'YouTube', color: 'text-[hsl(var(--platform-youtube))]', bg: 'bg-[hsl(var(--platform-youtube))]', icon: 'smart_display' },
  facebook: { name: 'Facebook', color: 'text-[hsl(var(--platform-facebook))]', bg: 'bg-[hsl(var(--platform-facebook))]', icon: 'thumb_up' },
  x: { name: 'Twitter / X', color: 'text-[hsl(var(--platform-twitter))]', bg: 'bg-[hsl(var(--platform-twitter))]', icon: 'twitter' },
  twitter: { name: 'Twitter / X', color: 'text-[hsl(var(--platform-twitter))]', bg: 'bg-[hsl(var(--platform-twitter))]', icon: 'twitter' },
}

export const STATUS_DOT: Record<string, Record<string, string>> = {
  instagram: { published: 'bg-[hsl(var(--success))]', scheduled: 'bg-[hsl(var(--warning))]', draft: 'bg-neutral-400', failed: 'bg-[hsl(var(--destructive))]', cancelled: 'bg-neutral-400' },
  tiktok: { published: 'bg-[hsl(var(--success))]', scheduled: 'bg-[hsl(var(--warning))]', draft: 'bg-neutral-400', failed: 'bg-[hsl(var(--destructive))]', cancelled: 'bg-neutral-400' },
  linkedin: { published: 'bg-[hsl(var(--success))]', scheduled: 'bg-[hsl(var(--warning))]', draft: 'bg-neutral-400', failed: 'bg-[hsl(var(--destructive))]', cancelled: 'bg-neutral-400' },
  youtube: { published: 'bg-[hsl(var(--success))]', scheduled: 'bg-[hsl(var(--warning))]', draft: 'bg-neutral-400', failed: 'bg-[hsl(var(--destructive))]', cancelled: 'bg-neutral-400' },
  facebook: { published: 'bg-[hsl(var(--success))]', scheduled: 'bg-[hsl(var(--warning))]', draft: 'bg-neutral-400', failed: 'bg-[hsl(var(--destructive))]', cancelled: 'bg-neutral-400' },
  x: { published: 'bg-[hsl(var(--success))]', scheduled: 'bg-[hsl(var(--warning))]', draft: 'bg-neutral-400', failed: 'bg-[hsl(var(--destructive))]', cancelled: 'bg-neutral-400' },
  twitter: { published: 'bg-[hsl(var(--success))]', scheduled: 'bg-[hsl(var(--warning))]', draft: 'bg-neutral-400', failed: 'bg-[hsl(var(--destructive))]', cancelled: 'bg-neutral-400' },
}

export const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  published: { label: 'Published', badge: 'bg-[hsl(var(--success))/15] text-[hsl(var(--success))] border-[hsl(var(--success))/30]', dot: 'bg-[hsl(var(--success))]' },
  scheduled: { label: 'Terjadwal', badge: 'bg-[hsl(var(--warning))/15] text-[hsl(var(--warning))] border-[hsl(var(--warning))/30]', dot: 'bg-[hsl(var(--warning))]' },
  draft: { label: 'Draft', badge: 'bg-neutral-500/15 text-neutral-700 dark:text-neutral-400 border-neutral-500/30', dot: 'bg-neutral-400' },
  failed: { label: 'Gagal', badge: 'bg-[hsl(var(--destructive))/15] text-[hsl(var(--destructive))] border-[hsl(var(--destructive))/30]', dot: 'bg-[hsl(var(--destructive))]' },
  cancelled: { label: 'Batal', badge: 'bg-neutral-400/15 text-neutral-500 border-neutral-400/30', dot: 'bg-neutral-300' },
}
