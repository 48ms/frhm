import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'
import { createOAuthState, OAUTH_STATE_COOKIE, OAUTH_STATE_TTL_SECONDS } from '@/lib/social/oauth-state'
import { z } from 'zod'

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
    const ayrshareApiKey = process.env.AYRSHARE_API_KEY
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

    // If client doesn't have an Ayrshare profile yet, create one
    if (!profileKey) {
      const createProfileRes = await fetch("https://app.ayrshare.com/api/profiles/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ayrshareApiKey}`
        },
        body: JSON.stringify({ title: `Client_${clientId}` })
      })
      
      const createData = await createProfileRes.json()
      if (createData.status === 'error' || !createData.profileKey) {
        console.error("Ayrshare Create Profile Error:", createData)
        return NextResponse.json({ error: 'Gagal membuat Profile di Ayrshare.' }, { status: 500 })
      }
      
      profileKey = createData.profileKey

      // Save to our DB
      await supabase
        .from('clients')
        .update({ ayrshare_profile_key: profileKey })
        .eq('id', clientId)
    }

    // Usually Ayrshare uses JWT for Social Linking.
    // However, if we don't have JWT implemented, we can redirect to a direct login link 
    // or return the profileKey for the frontend to use Ayrshare's direct connection widget.
    // For now, we simulate a direct OAuth URL generation pattern using Ayrshare's portal.
    const callbackUrl = new URL(process.env.NEXT_PUBLIC_APP_URL + '/api/social/callback')
    callbackUrl.searchParams.set('clientId', clientId)
    callbackUrl.searchParams.set('platform', platform)

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
    callbackUrl.searchParams.set('state', stateToken)

    const redirectUrl = `https://app.ayrshare.com/link?profileKey=${profileKey}&platform=${platform}&redirect_uri=${encodeURIComponent(callbackUrl.toString())}`

    void logAudit({
      actorId: user.id,
      action: 'social.oauth_initiated',
      entityType: 'social_account',
      clientId,
      summary: `Initiated Ayrshare OAuth for ${platform} (Client: ${clientId})`,
      metadata: { platform, profileKey },
    })

    const response = NextResponse.json({ success: true, url: redirectUrl })
    response.cookies.set({
      name: OAUTH_STATE_COOKIE,
      value: stateToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
