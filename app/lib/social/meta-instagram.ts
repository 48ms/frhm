import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

export interface ConnectedInstagramAccount {
  pageId: string
  pageName: string
  pageAccessToken: string
  igBusinessId: string
  username: string
  name?: string
  profilePictureUrl?: string
  followersCount?: number
}

/**
 * Builds the official Meta Facebook/Instagram OAuth dialog authorization URL.
 */
export function getMetaInstagramOAuthUrl(stateToken: string): string {
  const appId = env.server.META_APP_ID
  if (!appId) {
    throw new Error('META_APP_ID is not configured in environment variables')
  }

  const baseUrl = env.server.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'
  const redirectUri = env.server.META_REDIRECT_URI || `${baseUrl}/api/social/instagram/callback`

  const scopes = [
    'instagram_basic',
    'instagram_manage_insights',
    'instagram_content_publish',
    'pages_show_list',
    'pages_read_engagement',
  ].join(',')

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: 'code',
    state: stateToken,
  })

  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
}

/**
 * Exchanges authorization code for a short-lived token, then exchanges it for a 60-day Long-Lived Token.
 */
export async function exchangeMetaCodeForToken(code: string): Promise<{ accessToken: string; expiresIn: number }> {
  const appId = env.server.META_APP_ID
  const appSecret = env.server.META_APP_SECRET
  if (!appId || !appSecret) {
    throw new Error('META_APP_ID or META_APP_SECRET is not configured')
  }

  const baseUrl = env.server.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'
  const redirectUri = env.server.META_REDIRECT_URI || `${baseUrl}/api/social/instagram/callback`

  // 1. Get short-lived token
  const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
  tokenUrl.searchParams.set('client_id', appId)
  tokenUrl.searchParams.set('client_secret', appSecret)
  tokenUrl.searchParams.set('redirect_uri', redirectUri)
  tokenUrl.searchParams.set('code', code)

  const tokenRes = await fetch(tokenUrl.toString(), { method: 'GET' })
  const tokenData = await tokenRes.json()

  if (!tokenRes.ok || !tokenData.access_token) {
    logger.error('Meta OAuth code exchange failed', { error: tokenData })
    throw new Error(tokenData?.error?.message || 'Gagal menukar kode otorisasi Meta')
  }

  const shortLivedToken = tokenData.access_token

  // 2. Exchange for 60-day Long-Lived User Access Token
  const longLivedUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
  longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token')
  longLivedUrl.searchParams.set('client_id', appId)
  longLivedUrl.searchParams.set('client_secret', appSecret)
  longLivedUrl.searchParams.set('fb_exchange_token', shortLivedToken)

  const longLivedRes = await fetch(longLivedUrl.toString(), { method: 'GET' })
  const longLivedData = await longLivedRes.json()

  if (!longLivedRes.ok || !longLivedData.access_token) {
    // If long-lived exchange fails, fallback gracefully to short-lived token
    return {
      accessToken: shortLivedToken,
      expiresIn: tokenData.expires_in || 3600,
    }
  }

  return {
    accessToken: longLivedData.access_token,
    expiresIn: longLivedData.expires_in || 5184000, // ~60 days in seconds
  }
}

/**
 * Retrieves connected Instagram Business Accounts from the user's managed Facebook Pages.
 */
export async function getConnectedInstagramAccounts(userAccessToken: string): Promise<ConnectedInstagramAccount[]> {
  const accountsUrl = new URL('https://graph.facebook.com/v19.0/me/accounts')
  accountsUrl.searchParams.set(
    'fields',
    'id,name,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count}',
  )
  accountsUrl.searchParams.set('access_token', userAccessToken)

  const res = await fetch(accountsUrl.toString(), { method: 'GET' })
  const data = await res.json()

  if (!res.ok) {
    logger.error('Failed to fetch Facebook Pages from Meta', { error: data })
    const isTokenExpired = data?.error?.code === 190 || data?.error?.error_subcode === 463
    const message = isTokenExpired
      ? 'Sesi otorisasi Meta telah kedaluwarsa atau dicabut (OAuth code 190). Silakan hubungkan ulang akun Instagram.'
      : data?.error?.message || 'Gagal mengambil data halaman dari Meta Graph API'
    throw new Error(message)
  }

  const pages = data.data || []
  const results: ConnectedInstagramAccount[] = []

  for (const page of pages) {
    if (page.instagram_business_account) {
      const ig = page.instagram_business_account
      results.push({
        pageId: page.id,
        pageName: page.name,
        pageAccessToken: page.access_token,
        igBusinessId: ig.id,
        username: ig.username,
        name: ig.name,
        profilePictureUrl: ig.profile_picture_url,
        followersCount: ig.followers_count,
      })
    }
  }

  return results
}
