import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit/log'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { verifyOAuthState, OAUTH_STATE_COOKIE } from '@/lib/social/oauth-state'
import { env } from '@/lib/env'
import { getRequestOrigin } from '@/lib/request-origin'

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return null
}

export async function GET(req: Request) {
  const origin = getRequestOrigin(req)
  try {
    const url = new URL(req.url)
    const platform = url.searchParams.get('platform')
    const error = url.searchParams.get('error')
    const stateParam = url.searchParams.get('state')
    const cookieState = readCookie(req, OAUTH_STATE_COOKIE)

    // The callback must present the signed state token minted by /api/social/
    // oauth-url. It is accepted from the query string OR the httpOnly cookie;
    // both must be present and identical to prevent tampering.
    const state = verifyOAuthState(stateParam)
    if (!state || !cookieState || stateParam !== cookieState) {
      void logAudit({
        action: 'social.oauth_rejected',
        entityType: 'social_account',
        summary: 'OAuth callback rejected: missing or invalid state token',
        metadata: { platform, hasStateParam: Boolean(stateParam), hasCookie: Boolean(cookieState) },
      })
      return NextResponse.redirect(
        new URL('/admin/social-accounts?error=invalid_oauth_state', origin)
      )
    }

    // From here on, trust ONLY the signed payload — never the raw query string.
    const clientId = state.clientId
    const signedPlatform = state.platform

    // Provider rejected / user cancelled.
    if (error) {
      void logAudit({
        actorId: state.userId,
        action: 'social.oauth_failed',
        entityType: 'social_account',
        clientId,
        summary: `OAuth connection failed or was cancelled for ${signedPlatform}`,
        metadata: { platform: signedPlatform, error },
      })

      let errorMessage = error
      if (error === 'access_denied') errorMessage = 'Koneksi dibatalkan oleh pengguna'
      if (error === 'user_cancelled') errorMessage = 'Koneksi dibatalkan oleh pengguna'

      const failed = NextResponse.redirect(
        new URL(`/admin/social-accounts?error=${encodeURIComponent(errorMessage)}`, origin)
      )
      failed.cookies.delete(OAUTH_STATE_COOKIE)
      return failed
    }

    if (!clientId || !signedPlatform) {
      return NextResponse.redirect(new URL('/admin/social-accounts?error=missing_params', origin))
    }

    const apiKey = env.server.AYRSHARE_API_KEY
    if (!apiKey) {
      return NextResponse.redirect(
        new URL('/admin/social-accounts?error=ayrshare_not_configured', origin)
      )
    }

    // Persist to client_channels to display in the dashboard
    const supabase = await createSupabaseServiceClient()

    // Fetch client details
    const { data: clientData } = await supabase
      .from('clients')
      .select('name, ayrshare_profile_key')
      .eq('id', clientId)
      .single()

    const normalizedPlatform = signedPlatform.toLowerCase()
    const clientSlug = clientData?.name ? clientData.name.toLowerCase().replace(/[^a-z0-9_]/g, '_') : 'official'
    let avatar_url: string | null = null
    let handle = `@${clientSlug}.${normalizedPlatform}`

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
        const pData = profiles[normalizedPlatform]
        if (pData) {
          if (pData.picture) avatar_url = pData.picture
          if (pData.username) handle = pData.username.startsWith('@') ? pData.username : `@${pData.username}`
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
      .eq('platform', normalizedPlatform)
      .maybeSingle()

    const now = new Date().toISOString()
    if (!existing) {
      await supabase
        .from('client_channels')
        .insert({
          client_id: clientId,
          platform: normalizedPlatform,
          status: 'terhubung',
          handle,
          avatar_url,
          confirmed_at: now
        })
    } else {
      await supabase
        .from('client_channels')
        .update({
          status: 'terhubung',
          handle,
          avatar_url,
          confirmed_at: now,
          updated_at: now
        })
        .eq('id', existing.id)
    }

    void logAudit({
      actorId: state.userId,
      action: 'social.oauth_connected',
      entityType: 'social_account',
      clientId,
      summary: `Connected ${signedPlatform} account via Ayrshare`,
      metadata: { platform: signedPlatform },
    })

    const ok = NextResponse.redirect(
      new URL(`/admin/social-accounts?clientId=${clientId}&success=connected`, origin)
    )
    ok.cookies.delete(OAUTH_STATE_COOKIE)
    return ok
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.redirect(new URL(`/admin/social-accounts?error=${encodeURIComponent(msg)}`, origin))
  }
}
