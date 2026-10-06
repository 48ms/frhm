import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit/log'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const clientId = url.searchParams.get('clientId')
    const platform = url.searchParams.get('platform')
    const error = url.searchParams.get('error')

    // Provider rejected / user cancelled.
    if (error) {
      if (clientId && platform) {
        void logAudit({
          action: 'social.oauth_failed',
          entityType: 'social_account',
          clientId,
          summary: `OAuth connection failed or was cancelled for ${platform}`,
          metadata: { platform, error },
        })
      }
      
      let errorMessage = error
      if (error === 'access_denied') errorMessage = 'Koneksi dibatalkan oleh pengguna'
      if (error === 'user_cancelled') errorMessage = 'Koneksi dibatalkan oleh pengguna'
      
      return NextResponse.redirect(
        new URL(`/admin/social-accounts?error=${encodeURIComponent(errorMessage)}`, req.url)
      )
    }

    if (!clientId || !platform) {
      return NextResponse.redirect(new URL('/admin/social-accounts?error=missing_params', req.url))
    }

    const apiKey = process.env.AYRSHARE_API_KEY
    if (!apiKey) {
      return NextResponse.redirect(
        new URL('/admin/social-accounts?error=ayrshare_not_configured', req.url)
      )
    }

    // Persist to client_channels to display in the dashboard
    const supabase = await createSupabaseServiceClient()
    
    // Fetch profile key
    const { data: clientData } = await supabase
      .from('clients')
      .select('ayrshare_profile_key')
      .eq('id', clientId)
      .single()

    let avatar_url: string | null = null
    let handle = `${platform} account`

    if (clientData?.ayrshare_profile_key) {
      try {
        const res = await fetch("https://app.ayrshare.com/api/profiles", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Profile-Key": clientData.ayrshare_profile_key
          }
        })
        const profiles = await res.json()
        const pData = profiles[platform.toLowerCase()]
        if (pData) {
          if (pData.picture) avatar_url = pData.picture
          if (pData.username) handle = pData.username
        }
      } catch (e) {
        console.error("Failed to fetch profile info from ayrshare", e)
      }
    }

    // Check if channel already exists
    const { data: existing } = await supabase
      .from('client_channels')
      .select('id')
      .eq('client_id', clientId)
      .eq('platform', platform)
      .maybeSingle()

    if (!existing) {
      await supabase
        .from('client_channels')
        .insert({
          client_id: clientId,
          platform: platform,
          status: 'terhubung',
          handle,
          avatar_url,
          confirmed_at: new Date().toISOString()
        })
    } else {
      await supabase
        .from('client_channels')
        .update({ 
          status: 'terhubung', 
          handle, 
          avatar_url,
          confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', existing.id)
    }

    void logAudit({
      action: 'social.oauth_connected',
      entityType: 'social_account',
      clientId,
      summary: `Connected ${platform} account via Ayrshare`,
      metadata: { platform },
    })

    return NextResponse.redirect(
      new URL(`/admin/social-accounts?clientId=${clientId}&success=connected`, req.url)
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.redirect(new URL(`/admin/social-accounts?error=${encodeURIComponent(msg)}`, req.url))
  }
}
