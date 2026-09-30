import { createClient as createServiceClient } from '@supabase/supabase-js'

/**
 * Service role Supabase client , for admin-only operations that bypass RLS.
 * Use this instead of importing from @supabase/supabase-js directly.
 */
export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createServiceClient(url, key)
}
