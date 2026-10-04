import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Read the WoopSocial bridge key from bridge_config — the one server-side place it lives.
 *
 * Using a server client (session cookie) keeps RLS in play: only the admin can ever read the
 * key back out of the table. The key is a production credential and must never leave the server.
 *
 * Fallback: process.env.BRIDGE_API_KEY for serverless/cron contexts where no session exists.
 */
export async function getBridgeKey(): Promise<string | null> {
  // Direct env fallback for cron/serverless contexts (no session/cookies available)
  const envKey = process.env.BRIDGE_API_KEY?.trim() || null
  if (envKey) return envKey

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() { /* read-only helper */ },
      },
    }
  )
  const { data } = await supabase
    .from('bridge_config').select('api_key').eq('id', 'woopsocial').maybeSingle()
  const key = (data?.api_key as string | null) ?? null
  return key || null
}