import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { clientId, platform } = await req.json()
    if (!clientId || !platform) {
      return NextResponse.json({ error: 'Missing clientId or platform' }, { status: 400 })
    }

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
    
    const redirectUrl = `https://app.ayrshare.com/link?profileKey=${profileKey}&platform=${platform}&redirect_uri=${encodeURIComponent(callbackUrl.toString())}`

    void logAudit({
      actorId: user.id,
      action: 'social.oauth_initiated',
      entityType: 'social_account',
      clientId,
      summary: `Initiated Ayrshare OAuth for ${platform} (Client: ${clientId})`,
      metadata: { platform, profileKey },
    })

    return NextResponse.json({ success: true, url: redirectUrl })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
