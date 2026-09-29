import type { ExtendedColumnSort } from '@/types/data-table'

/** A client row enriched with deliverable aggregates from dashboard_summary. */
export interface ClientWithStats {
  id: string
  name: string
  contact_email: string | null
  created_at: string
  /** Total deliverables ever created for this client. */
  totalDeliverables: number
  /** Deliverables with status 'sent' — i.e. awaiting client approval. */
  pendingCount: number
}

/** Filter/sort state shared between the URL search params and the query key. */
export interface ClientsFilterParams {
  page?: number
  perPage?: number
  search?: string
  status?: string
  sort?: ExtendedColumnSort<ClientWithStats>[]
}

/** Payload for the paginated list query, including facet counts for the toolbar. */
export interface ClientsListResult {
  data: ClientWithStats[]
  pageCount: number
  totalAll: number
  pendingAll: number
  readyAll: number
}

export interface CreateClientInput {
  name: string
  contact_email?: string | null
  contact_phone?: string | null
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
  id: string
}
