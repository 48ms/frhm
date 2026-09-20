import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

/**
 * Check if a feature flag is enabled in the database.
 * Uses the service_role key because the table is locked down via RLS.
 * Caches results in-memory for 60 seconds to avoid hammering the DB on every request.
 */

type FlagRow = { enabled: boolean }
const cache = new Map<string, { enabled: boolean; fetchedAt: number }>()
const CACHE_TTL = 60_000 // 1 minute

export async function isFeatureEnabled(key: string): Promise<boolean> {
  try {
    const now = Date.now()
    const cached = cache.get(key)
    if (cached && now - cached.fetchedAt < CACHE_TTL) {
      return cached.enabled
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) return false

    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', key)
      .maybeSingle()

    if (error || !data) {
      logger.warn(`Feature flag check failed: ${key}`, { error })
      return false // Fail closed: if DB is down, disable risky features
    }

    cache.set(key, { enabled: data.enabled, fetchedAt: now })
    return data.enabled
  } catch (e) {
    logger.error(`Feature flag check crashed: ${key}`, { error: e })
    return false
  }
}

/**
 * Directly update a feature flag (used in admin settings, only callable server-side).
 */
export async function setFeatureFlag(key: string, enabled: boolean): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return false

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await supabase.from('feature_flags').upsert({
    key,
    enabled,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'key' })

  if (error) {
    logger.error(`Failed to set feature flag: ${key}`, { error })
    return false
  }

  // Invalidate cache
  cache.delete(key)
  return true
}
