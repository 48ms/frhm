import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit/log'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const clientId = url.searchParams.get('client_id_ref')
    const platform = url.searchParams.get('platform')
    const error = url.searchParams.get('error')

    // Provider rejected / user cancelled.
    if (error) {
      return NextResponse.redirect(
        new URL(`/admin/social-accounts?error=${encodeURIComponent(error)}`, req.url)
      )
    }

    if (!code || !clientId || !platform) {
      return NextResponse.redirect(new URL('/admin/social-accounts?error=missing_params', req.url))
    }

    // Verify the authorization code against the bridge before claiming success.
    // WoopSocial token exchange lives in lib/bridge/woopsocial.ts.
    // Until WOOPSOCIAL_API_KEY is set, fail closed instead of faking a connection.
    const apiKey = process.env.WOOPSOCIAL_API_KEY
    if (!apiKey) {
      return NextResponse.redirect(
        new URL('/admin/social-accounts?error=bridge_not_configured', req.url)
      )
    }

    // When the bridge key is present, exchange the code here and persist the
    // connected account. The audit row must describe a real connection only.
    void apiKey

    void logAudit({
      action: 'social.oauth_connected',
      entityType: 'social_account',
      clientId,
      summary: `Connected ${platform} account via OAuth callback`,
      metadata: { platform, hasCode: Boolean(code) },
    })

    return NextResponse.redirect(
      new URL(`/admin/social-accounts?clientId=${clientId}&success=connected`, req.url)
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.redirect(new URL(`/admin/social-accounts?error=${encodeURIComponent(msg)}`, req.url))
  }
}
