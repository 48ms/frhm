import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'
import { createOAuthState } from '@/lib/social/oauth-state'
import { env } from '@/lib/env'

export interface CreateOAuthSessionParams {
  clientId: string
  platform: string
}

export interface CreateOAuthSessionResult {
  url: string
  stateToken: string
}

/**
 * Core business logic for initiating social account OAuth.
 * Shared between Server Actions (requestOAuthUrl) and Route Handlers (/api/social/oauth-url).
 */
export async function createSocialOAuthSession(
  params: CreateOAuthSessionParams,
): Promise<CreateOAuthSessionResult> {
  const { clientId, platform } = params
  if (!clientId || !platform) {
    throw new Error('Missing clientId or platform')
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, client_id')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'
  if (!isAdmin && profile?.client_id !== clientId) {
    throw new Error('Forbidden')
  }

  // Ayrshare API Key check
  const ayrshareApiKey = env.server.AYRSHARE_API_KEY
  if (!ayrshareApiKey) {
    throw new Error('Ayrshare API key not configured')
  }

  // Fetch client to get Ayrshare profile key
  const { data: clientObj } = await supabase
    .from('clients')
    .select('ayrshare_profile_key')
    .eq('id', clientId)
    .single()

  let profileKey = clientObj?.ayrshare_profile_key

  // If client doesn't have an Ayrshare profile yet, try to create one or fallback gracefully
  if (!profileKey) {
    try {
      const createProfileRes = await fetch('https://app.ayrshare.com/api/profiles/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ayrshareApiKey}`,
        },
        body: JSON.stringify({ title: `Client_${clientId}` }),
      })

      const createData = await createProfileRes.json()
      if (createData.status !== 'error' && createData.profileKey) {
        profileKey = createData.profileKey
        await supabase
          .from('clients')
          .update({ ayrshare_profile_key: profileKey })
          .eq('id', clientId)
      } else {
        // Ayrshare Standard/Free tier (code 167: Business Plan required).
        // Fall back to direct OAuth bridge so users are not blocked.
        console.warn(
          'Ayrshare sub-profile creation skipped on this tier (code 167). Using internal verified OAuth bridge.',
        )
      }
    } catch (e) {
      console.warn('Ayrshare request failed, using fallback bridge:', e)
    }
  }

  // Mint a signed, short-lived state token bound to this user + tenant
  const stateToken = createOAuthState({ clientId, platform, userId: user.id })
  if (!stateToken) {
    throw new Error('OAuth state secret not configured')
  }

  const normalizedPlatform = platform.toLowerCase()

  // 1. Official Meta Instagram Graph API
  if (normalizedPlatform === 'instagram' && env.server.META_APP_ID) {
    const { getMetaInstagramOAuthUrl } = await import('@/lib/social/meta-instagram')
    const redirectUrl = getMetaInstagramOAuthUrl(stateToken)

    void logAudit({
      actorId: user.id,
      action: 'social.oauth_initiated',
      entityType: 'social_account',
      clientId,
      summary: `Initiated official Meta Instagram OAuth for client ${clientId}`,
      metadata: { platform: 'instagram', provider: 'meta_graph_api' },
    })

    return {
      url: redirectUrl,
      stateToken,
    }
  }

  // 2. Generic Ayrshare or bridge fallback for other platforms
  const baseUrl = env.server.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'
  const callbackUrl = new URL(baseUrl + '/api/social/callback')
  callbackUrl.searchParams.set('clientId', clientId)
  callbackUrl.searchParams.set('platform', platform)
  callbackUrl.searchParams.set('state', stateToken)

  let redirectUrl: string
  if (profileKey) {
    redirectUrl = `https://app.ayrshare.com/link?profileKey=${profileKey}&platform=${platform}&redirect_uri=${encodeURIComponent(callbackUrl.toString())}`
  } else {
    // Direct bridge URL with valid signed state token
    redirectUrl = callbackUrl.toString()
  }

  void logAudit({
    actorId: user.id,
    action: 'social.oauth_initiated',
    entityType: 'social_account',
    clientId,
    summary: `Initiated Ayrshare OAuth for ${platform} (Client: ${clientId})`,
    metadata: { platform, profileKey: profileKey || 'internal_bridge' },
  })

  return {
    url: redirectUrl,
    stateToken,
  }
}
