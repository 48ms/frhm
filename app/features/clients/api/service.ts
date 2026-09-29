import type { SupabaseClient } from '@/lib/supabase/client'
import type {
  ClientWithStats,
  ClientsFilterParams,
  ClientsListResult,
  CreateClientInput,
  UpdateClientInput,
} from './types'

/** Shape of a dashboard_summary row (the aggregation view from migration 043). */
interface DashboardSummaryRow {
  client_id: string
  client_name: string
  contact_email: string | null
  sent_count: number
  deliverable_count: number
}

/** Map a UI column id onto the aggregation view's column name. */
const SORT_COLUMN_MAP: Record<string, string> = {
  name: 'client_name',
  totalDeliverables: 'deliverable_count',
  status: 'sent_count',
  created_at: 'client_name',
}

const EMPTY_RESULT: ClientsListResult = {
  data: [],
  pageCount: 0,
  totalAll: 0,
  pendingAll: 0,
  readyAll: 0,
}

/**
 * Paginated client list enriched with deliverable aggregates.
 *
 * Reads the `dashboard_summary` view rather than the raw table so the
 * deliverable counts come from one query instead of an N+1 fan-out. The
 * toolbar's facet counts (totalAll / pendingAll / readyAll) are counted over
 * the whole table, not the filtered page, so they stay stable while paging.
 */
export async function fetchClients(
  supabase: SupabaseClient,
  params: ClientsFilterParams = {}
): Promise<ClientsListResult> {
  const page = params.page ?? 1
  const perPage = params.perPage ?? 10
  const search = params.search?.trim() ?? ''
  const status = params.status ?? 'all'

  // Facet counts over ALL clients (unfiltered) for the toolbar chips.
  const [totalRes, pendingRes, readyRes] = await Promise.all([
    supabase.from('dashboard_summary').select('client_id', { count: 'exact', head: true }),
    supabase
      .from('dashboard_summary')
      .select('client_id', { count: 'exact', head: true })
      .gt('sent_count', 0),
    supabase
      .from('dashboard_summary')
      .select('client_id', { count: 'exact', head: true })
      .eq('sent_count', 0),
  ])

  if (totalRes.error || pendingRes.error || readyRes.error) {
    console.error('[fetchClients counts error]', totalRes.error ?? pendingRes.error ?? readyRes.error)
    return EMPTY_RESULT
  }

  // Filtered + paginated rows.
  let query = supabase
    .from('dashboard_summary')
    .select(
      'client_id, client_name, contact_email, sent_count, deliverable_count',
      { count: 'exact' }
    )

  if (search) {
    query = query.ilike('client_name', `%${search}%`)
  }
  if (status === 'pending') {
    query = query.gt('sent_count', 0)
  } else if (status === 'ready') {
    query = query.eq('sent_count', 0)
  }

  const sortRule = params.sort?.[0]
  const sortColumn = (sortRule && SORT_COLUMN_MAP[sortRule.id]) || 'client_name'
  query = query.order(sortColumn, { ascending: sortRule ? !sortRule.desc : true })

  const from = (page - 1) * perPage
  query = query.range(from, from + perPage - 1)

  const { data, error, count } = await query
  if (error) {
    console.error('[fetchClients error]', error)
    return {
      ...EMPTY_RESULT,
      totalAll: totalRes.count ?? 0,
      pendingAll: pendingRes.count ?? 0,
      readyAll: readyRes.count ?? 0,
    }
  }

  const rows = (data ?? []) as unknown as DashboardSummaryRow[]
  const filteredTotal = count ?? rows.length

  return {
    data: rows.map((r) => ({
      id: r.client_id,
      name: r.client_name,
      contact_email: r.contact_email,
      created_at: '',
      totalDeliverables: Number(r.deliverable_count) || 0,
      pendingCount: Number(r.sent_count) || 0,
    })),
    pageCount: Math.max(1, Math.ceil(filteredTotal / perPage)),
    totalAll: totalRes.count ?? 0,
    pendingAll: pendingRes.count ?? 0,
    readyAll: readyRes.count ?? 0,
  }
}

/** Single client with its deliverable aggregates. */
export async function fetchClientById(
  supabase: SupabaseClient,
  id: string
): Promise<ClientWithStats | null> {
  const { data, error } = await supabase
    .from('dashboard_summary')
    .select('client_id, client_name, contact_email, sent_count, deliverable_count')
    .eq('client_id', id)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('[fetchClientById error]', error)
    return null
  }

  const row = data as unknown as DashboardSummaryRow
  return {
    id: row.client_id,
    name: row.client_name,
    contact_email: row.contact_email,
    created_at: '',
    totalDeliverables: Number(row.deliverable_count) || 0,
    pendingCount: Number(row.sent_count) || 0,
  }
}

export async function createClientRecord(
  supabase: SupabaseClient,
  input: CreateClientInput
) {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      name: input.name,
      contact_email: input.contact_email ?? null,
      contact_phone: input.contact_phone ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateClientRecord(
  supabase: SupabaseClient,
  input: UpdateClientInput
) {
  const { id, ...patch } = input
  const { data, error } = await supabase
    .from('clients')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteClientRecord(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
  return { id }
}
