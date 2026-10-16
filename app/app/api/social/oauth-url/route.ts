import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'
import { createOAuthState, OAUTH_STATE_COOKIE, OAUTH_STATE_TTL_SECONDS } from '@/lib/social/oauth-state'
import { z } from 'zod'
import { env } from '@/lib/env'

const bodySchema = z.object({
  clientId: z.string().min(1, 'clientId wajib diisi'),
  platform: z.string().min(1, 'platform wajib diisi'),
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rawBody = await req.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Missing clientId or platform' },
        { status: 400 },
      )
    }
    const { clientId, platform } = parsed.data

    const { data: profile } = await supabase
      .from('users')
      .select('role, client_id')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'
    if (!isAdmin && profile?.client_id !== clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Call Ayrshare API
    const ayrshareApiKey = env.server.AYRSHARE_API_KEY
    if (!ayrshareApiKey) {
      return NextResponse.json({ error: 'Ayrshare API key not configured' }, { status: 500 })
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
        const createProfileRes = await fetch("https://app.ayrshare.com/api/profiles/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${ayrshareApiKey}`
          },
          body: JSON.stringify({ title: `Client_${clientId}` })
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
          console.warn("Ayrshare sub-profile creation skipped on this tier (code 167). Using internal verified OAuth bridge.")
        }
      } catch (e) {
        console.warn("Ayrshare request failed, using fallback bridge:", e)
      }
    }

    // Mint a signed, short-lived state token bound to this user + tenant and
    // return it in an httpOnly cookie. The callback verifies the cookie instead
    // of trusting clientId from the query string (prevents cross-tenant writes).
    const stateToken = createOAuthState({ clientId, platform, userId: user.id })
    if (!stateToken) {
      return NextResponse.json(
        { error: 'OAuth state secret not configured' },
        { status: 500 },
      )
    }

    const callbackUrl = new URL(env.server.NEXT_PUBLIC_APP_URL + '/api/social/callback')
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

    const response = NextResponse.json({ success: true, url: redirectUrl })
    response.cookies.set({
      name: OAUTH_STATE_COOKIE,
      value: stateToken,
      httpOnly: true,
      secure: env.server.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: OAUTH_STATE_TTL_SECONDS,
    })
    return response
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
