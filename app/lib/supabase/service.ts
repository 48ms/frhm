import { createClient as createServiceClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * Service role Supabase client , for admin-only operations that bypass RLS.
 * Use this instead of importing from @supabase/supabase-js directly.
 */
export function createSupabaseServiceClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env.server
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di environment server.')
  }
  return createServiceClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}
