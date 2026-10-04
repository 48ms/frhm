/**
 * Get the WoopSocial project ID for a client.
 * Returns null if the client has no bridge project configured (not yet connected).
 *
 * Uses the service-role client: this is called from the publish cron, where no
 * user session exists. A session-based client would have `auth.uid() = null`,
 * so RLS would block the read and every client would look unconfigured.
 */
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function getClientWooSocialProjectId(clientId: string): Promise<string | null> {
  const supabase = createSupabaseServiceClient()
  const { data } = await supabase
    .from('clients')
    .select('woopsocial_project_id')
    .eq('id', clientId)
    .maybeSingle()

  if (!data) return null
  const projectId = data.woopsocial_project_id as string | null
  return projectId?.trim() || null
}
