import type { Deliverable } from '@/lib/supabase/types'

export interface DeliverableWithClient extends Deliverable {
  clients?: {
    name: string
    contact_email: string | null
  } | null
}

export type DeliverableStatus = 'draft' | 'sent' | 'approved' | 'revision_requested'
export type DeliverableType = 'brief' | 'content' | 'report'

export interface DeliverablesFilterParams {
  status?: string
  type?: string
  clientId?: string
  page?: number
  pageSize?: number
  search?: string
}
