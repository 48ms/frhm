import type { SupabaseClient } from '@/lib/supabase/client'
import type { DeliverableWithClient, DeliverablesFilterParams } from './types'
import type { Deliverable } from '@/lib/supabase/types'

export async function fetchDeliverables(
  supabase: SupabaseClient,
  params: DeliverablesFilterParams = {}
): Promise<DeliverableWithClient[]> {
  const query = supabase
    .from('deliverables')
    .select(`*, clients!left(name, contact_email)`)

  if (params.status && params.status !== 'all') {
    query.eq('status', params.status)
  }
  if (params.type && params.type !== 'all') {
    query.eq('type', params.type)
  }
  if (params.clientId) {
    query.eq('client_id', params.clientId)
  }

  query.order('updated_at', { ascending: false })

  const { data, error } = await query
  if (error) {
    console.error('[fetchDeliverables error]', error)
    return []
  }
  return (data as unknown as DeliverableWithClient[]) || []
}

export async function fetchDeliverableById(
  supabase: SupabaseClient,
  id: string
): Promise<DeliverableWithClient | null> {
  const { data, error } = await supabase
    .from('deliverables')
    .select(`*, clients!left(name, contact_email)`)
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as unknown as DeliverableWithClient
}

export async function updateDeliverableStatus(
  supabase: SupabaseClient,
  id: string,
  status: Deliverable['status']
) {
  const { data, error } = await supabase
    .from('deliverables')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Deliverable
}

export async function fetchClientName(
  supabase: SupabaseClient,
  clientId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('name')
    .eq('id', clientId)
    .single()
  if (error) return null
  return data?.name ?? null
}

export async function createDeliverable(
  supabase: SupabaseClient,
  data: {
    title: string
    client_id: string
    type: Deliverable['type']
    description?: string
    content?: string
  }
): Promise<Deliverable> {
  const { error } = await supabase.from('deliverables').insert(data)
  if (error) throw error
  return data as Deliverable
}
