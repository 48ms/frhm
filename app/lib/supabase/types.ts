// Custom Supabase types - re-export generated types + helpers
export * from './database.types'

// Form schemas (Zod)
import { z } from 'zod'

export const deliverableTypeSchema = z.enum(['brief', 'content', 'report'])
export const deliverableStatusSchema = z.enum(['draft', 'sent', 'approved', 'revision_requested'])
export const userRoleSchema = z.enum(['admin', 'client'])

export const createDeliverableSchema = z.object({
  type: deliverableTypeSchema,
  title: z.string().min(1, 'Judul wajib diisi').max(200, 'Judul terlalu panjang'),
  content_md: z.string().min(1, 'Isi wajib diisi'),
  external_link: z.string().url('Format URL tidak valid').optional().or(z.literal('')),
})

export const updateDeliverableSchema = createDeliverableSchema.partial()

export const createCommentSchema = z.object({
  content_md: z.string().min(1, 'Komentar tidak boleh kosong'),
})

export type CreateDeliverableInput = z.infer<typeof createDeliverableSchema>
export type UpdateDeliverableInput = z.infer<typeof updateDeliverableSchema>
export type CreateCommentInput = z.infer<typeof createCommentSchema>

// Action response types
export interface ActionResult<T = null> {
  success: boolean
  data?: T
  error?: string
  fieldErrors?: Record<string, string[]>
}

// Server Action return types
export type CreateDeliverableResult = ActionResult<{ id: string }>
export type UpdateDeliverableResult = ActionResult<{ id: string }>
export type UpdateDeliverableStatusResult = ActionResult<{ id: string; status: string }>
export type DeleteDeliverableResult = ActionResult<{ id: string }>
export type CreateCommentResult = ActionResult<{ id: string }>

// Deliverable with full relations for UI
export interface DeliverableWithRelations {
  id: string
  client_id: string
  type: 'brief' | 'content' | 'report'
  title: string
  content_md: string
  external_link: string | null
  status: 'draft' | 'sent' | 'approved' | 'revision_requested'
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  sent_at: string | null
  approved_at: string | null
  client: {
    id: string
    name: string
    contact_email: string | null
  }
  created_by_user: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
  updated_by_user: {
    id: string
    full_name: string | null
    avatar_url: string | null
  } | null
  comments_count?: number
  comments?: Array<{
    id: string
    content_md: string
    created_at: string
    user: {
      id: string
      full_name: string | null
      avatar_url: string | null
      role: 'admin' | 'client'
    }
  }>
  status_history?: Array<{
    id: string
    from_status: string | null
    to_status: string
    changed_by: string
    created_at: string
    changed_by_user: {
      id: string
      full_name: string | null
      role: 'admin' | 'client'
    }
  }>
}

// Status display helpers
export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent: 'Terkirim',
  approved: 'Disetujui',
  revision_requested: 'Minta Revisi',
}

export const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  approved: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  revision_requested: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
}

export const TYPE_LABELS: Record<string, string> = {
  brief: 'Brief',
  content: 'Konten',
  report: 'Laporan',
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || STATUS_COLORS.draft
}

export function getTypeLabel(type: string): string {
  return TYPE_LABELS[type] || type
}