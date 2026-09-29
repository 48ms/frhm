import { ScheduledPost, STATUS_DOT, STATUS_CONFIG } from '@/features/calendar/types'

/**
 * Format ISO string date to local time string (WIB timezone).
 * @example timeStr('2024-09-26T08:00:00Z') => '08.00'
 */
export function timeStr(iso: string): string {
  const d = new Date(iso)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}.${m}`
}

/** Resolve the status dot color, preferring the platform-specific mapping. */
export function getDotColor(post: ScheduledPost): string {
  return (STATUS_DOT[post.platform]?.[post.status] ?? STATUS_CONFIG[post.status]?.dot ?? 'bg-neutral-400')
}
