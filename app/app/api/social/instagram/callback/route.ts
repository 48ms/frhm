import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit/log'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { verifyOAuthState, OAUTH_STATE_COOKIE } from '@/lib/social/oauth-state'
import { exchangeMetaCodeForToken, getConnectedInstagramAccounts } from '@/lib/social/meta-instagram'
import { logger } from '@/lib/logger'
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
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')
    const errorDescription = url.searchParams.get('error_description')
    const stateParam = url.searchParams.get('state')
    const cookieState = readCookie(req, OAUTH_STATE_COOKIE)

    // 1. Verify CSRF state token
    const state = verifyOAuthState(stateParam)
    if (!state || !cookieState || stateParam !== cookieState) {
      void logAudit({
        action: 'social.oauth_rejected',
        entityType: 'social_account',
        summary: 'Meta OAuth callback rejected: missing or invalid state token',
        metadata: { hasStateParam: Boolean(stateParam), hasCookie: Boolean(cookieState) },
      })
      return NextResponse.redirect(
        new URL('/admin/social-accounts?error=invalid_oauth_state', origin),
      )
    }

    const { clientId } = state

    // 2. Handle provider rejection / user cancellation
    if (error || !code) {
      const msg = errorDescription || error || 'Koneksi dibatalkan oleh pengguna'
      void logAudit({
        actorId: state.userId,
        action: 'social.oauth_failed',
        entityType: 'social_account',
        clientId,
        summary: `Meta OAuth connection failed or was cancelled`,
        metadata: { error, errorDescription },
      })

      const failed = NextResponse.redirect(
        new URL(`/admin/social-accounts?clientId=${clientId}&error=${encodeURIComponent(msg)}`, origin),
      )
      failed.cookies.delete(OAUTH_STATE_COOKIE)
      return failed
    }

    // 3. Exchange code for 60-day Long-Lived Token
    const { accessToken } = await exchangeMetaCodeForToken(code)

    // 4. Fetch connected Instagram Business Accounts
    const igAccounts = await getConnectedInstagramAccounts(accessToken)

    if (igAccounts.length === 0) {
      const errMsg = 'Tidak ditemukan akun Instagram Business pada Halaman Facebook Anda. Pastikan akun Instagram bertipe Professional dan sudah terhubung ke Halaman Facebook.'
      const failed = NextResponse.redirect(
        new URL(`/admin/social-accounts?clientId=${clientId}&error=${encodeURIComponent(errMsg)}`, origin),
      )
      failed.cookies.delete(OAUTH_STATE_COOKIE)
      return failed
    }

    // Connect the first available Instagram account (or targeted handle)
    const targetAccount = igAccounts[0]
    const cleanHandle = targetAccount.username.startsWith('@')
      ? targetAccount.username
      : `@${targetAccount.username}`

    const supabase = await createSupabaseServiceClient()
    const now = new Date().toISOString()

    // 5. Upsert to client_channels
    const { data: existing } = await supabase
      .from('client_channels')
      .select('id')
      .eq('client_id', clientId)
      .eq('platform', 'instagram')
      .maybeSingle()

    if (existing) {
      await supabase
        .from('client_channels')
        .update({
          status: 'terhubung',
          handle: cleanHandle,
          avatar_url: targetAccount.profilePictureUrl || null,
          confirmed_at: now,
          updated_at: now,
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('client_channels').insert({
        client_id: clientId,
        platform: 'instagram',
        status: 'terhubung',
        handle: cleanHandle,
        avatar_url: targetAccount.profilePictureUrl || null,
        confirmed_at: now,
      })
    }

    // Also update follower count if available in dashboard_profiles
    if (typeof targetAccount.followersCount === 'number') {
      try {
        const { data: profile } = await supabase
          .from('dashboard_profiles')
          .select('id, metrics')
          .eq('client_id', clientId)
          .maybeSingle()

        if (profile) {
          const currentMetrics = (profile.metrics as Record<string, unknown>) || {}
          await supabase
            .from('dashboard_profiles')
            .update({
              metrics: {
                ...currentMetrics,
                audience_size: targetAccount.followersCount,
              },
            })
            .eq('id', profile.id)
        }
      } catch (e) {
        logger.warn('Failed to update dashboard_profile follower count', { error: e })
      }
    }

    void logAudit({
      actorId: state.userId,
      action: 'social.instagram_connected',
      entityType: 'social_account',
      clientId,
      summary: `Connected official Instagram Business account ${cleanHandle} via Meta Graph API`,
      metadata: {
        platform: 'instagram',
        igBusinessId: targetAccount.igBusinessId,
        pageId: targetAccount.pageId,
        pageName: targetAccount.pageName,
        followersCount: targetAccount.followersCount,
      },
    })

    const ok = NextResponse.redirect(
      new URL(`/admin/social-accounts?clientId=${clientId}&success=connected`, origin),
    )
    ok.cookies.delete(OAUTH_STATE_COOKIE)
    return ok
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
    return NextResponse.redirect(
      new URL(`/admin/social-accounts?error=${encodeURIComponent(msg)}`, origin),
    )
  }
}
