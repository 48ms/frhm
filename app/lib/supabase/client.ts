'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient, RealtimeChannel, User } from '@supabase/supabase-js'

export type { SupabaseClient, RealtimeChannel, User }

/**
 * Browser Supabase client , module-level singleton.
 *
 * `createBrowserClient` from @supabase/ssr already de-dupes internally, but calling
 * it on every render/import creates needless work and, more importantly, risks
 * multiple GoTrueClient instances (warnings + duplicate auth listeners) when a
 * component remounts. Caching the instance here guarantees one client per tab.
 */
import { env } from '@/lib/env'

let browserClient: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (!browserClient) {
    const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY } = env.client
    browserClient = createBrowserClient(
      NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    )
  }
  return browserClient
}
