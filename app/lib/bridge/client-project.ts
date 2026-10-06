/**
 * Get the Ayrshare profile key for a client.
 * Returns null if the client has no bridge profile configured (not yet connected).
 *
 * Uses the service-role client: this is called from the publish cron, where no
 * user session exists. A session-based client would have `auth.uid() = null`,
 * so RLS would block the read and every client would look unconfigured.
 */
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function getClientAyrshareProfileKey(clientId: string): Promise<string | null> {
  const supabase = createSupabaseServiceClient()
  const { data } = await supabase
    .from('clients')
    .select('ayrshare_profile_key')
    .eq('id', clientId)
    .maybeSingle()

  if (!data) return null
  const profileKey = data.ayrshare_profile_key as string | null
  return profileKey?.trim() || null
}
