import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { getActivePlatforms, getSocialAnalytics } from '@/lib/bridge/ayrshare'
import { verifyCronSecret } from '@/lib/cron/auth'
import { logAudit } from '@/lib/audit/log'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // Fail-closed cron auth
  const cronAuth = verifyCronSecret(process.env.CRON_SECRET, request.headers.get('authorization'))
  if (!cronAuth.ok) {
    logger.warn('cron.sync-analytics.rejected', { route: 'api/cron/sync-analytics', reason: cronAuth.reason })
    return NextResponse.json({ error: 'Unauthorized CRON trigger' }, { status: 401 })
  }

  const supabase = createSupabaseServiceClient()
  const apiKey = process.env.AYRSHARE_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'Ayrshare API key missing' }, { status: 503 })
  }

  // Fetch all clients that have ayrshare_profile_key
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, ayrshare_profile_key')
    .not('ayrshare_profile_key', 'is', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!clients || clients.length === 0) {
    return NextResponse.json({ message: 'No clients with Ayrshare profiles to sync' })
  }

  const results = []

  for (const client of clients) {
    try {
      const profileKey = client.ayrshare_profile_key!
      
      // Get linked platforms
      const platformsRes = await getActivePlatforms(apiKey, profileKey)
      if (!platformsRes.ok || platformsRes.data.length === 0) {
        continue // Skip if no active platforms
      }

      // Fetch aggregated social analytics from Ayrshare
      const analyticsRes = await getSocialAnalytics(apiKey, platformsRes.data, profileKey)
      if (!analyticsRes.ok) {
        throw new Error(analyticsRes.error)
      }

      const ayrshareData = analyticsRes.data

      // Transform Ayrshare Data to Frahma factual format for dashboard_profiles
      let totalFollowers = 0
      let totalEngagement = 0
      
      if (ayrshareData.analytics) {
         Object.values(ayrshareData.analytics).forEach((plat: any) => {
            totalFollowers += (plat.followersCount || plat.followers || 0)
            totalEngagement += (plat.engagement || 0)
         })
      }

      const metricsObject = {
        total_reach: totalFollowers,
        total_views: 0,
        audience_size: totalFollowers,
        engagement_rate: totalFollowers > 0 ? Number(((totalEngagement / totalFollowers) * 100).toFixed(2)) : 0,
        total_engagement: totalEngagement
      }

      const insights = [
        { label: "AUDIENCE REACTION", value: "Factual Sync", sub: "Data from Ayrshare" }
      ]

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('dashboard_profiles')
        .select('id')
        .eq('client_id', client.id)
        .maybeSingle()

      if (existingProfile) {
        // Update
        const { error: updateErr } = await supabase
          .from('dashboard_profiles')
          .update({
            peak_label: 'Synced via Ayrshare',
            peak_value: totalFollowers.toLocaleString(),
            metrics: metricsObject,
            insights: insights,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProfile.id)
        if (updateErr) throw new Error(updateErr.message)
      } else {
        // Insert
        const { error: insertErr } = await supabase
          .from('dashboard_profiles')
          .insert({
            client_id: client.id,
            greeting: `Hello ${client.name}`,
            velocity: 0,
            peak_label: 'Synced via Ayrshare',
            peak_value: totalFollowers.toLocaleString(),
            metrics: metricsObject,
            insights: insights,
            charts: {}
          })
        if (insertErr) throw new Error(insertErr.message)
      }

      results.push({ client_id: client.id, status: 'synced', totalFollowers })

    } catch (err: any) {
      logger.error(`Failed to sync analytics for client ${client.id}`, { error: err.message })
      results.push({ client_id: client.id, status: 'error', error: err.message })
    }
  }

  void logAudit({
    action: 'cron.sync_analytics',
    summary: `Synced analytics for ${results.length} clients`,
    request,
  })

  return NextResponse.json({ message: 'Sync complete', results })
}
