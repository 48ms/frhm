import type { SupabaseClient } from '@/lib/supabase/client'
import type { ContentProduction } from './types'

export async function fetchProductions(
  supabase: SupabaseClient,
  clientId: string
): Promise<ContentProduction[]> {
  const { data, error } = await supabase
    .from('content_productions')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as ContentProduction[]) ?? []
}

export async function deleteProduction(supabase: SupabaseClient, id: string) {
  const { error } = await supabase
    .from('content_productions')
    .delete()
    .eq('id', id)

  if (error) throw error
}
