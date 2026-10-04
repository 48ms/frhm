import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

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

    // Call WoopSocial bridge or generate redirect URL
    const woopApiKey = process.env.WOOPSOCIAL_API_KEY
    if (!woopApiKey) {
      return NextResponse.json({ error: 'WoopSocial API key not configured' }, { status: 500 })
    }

    // Generate OAuth URL via bridge mock or real API endpoint
    const redirectUrl = `https://api.woopsocial.com/v1/oauth/authorize?platform=${platform}&client_id_ref=${clientId}`

    void logAudit({
      actorId: user.id,
      action: 'social.oauth_initiated',
      entityType: 'social_account',
      clientId,
      summary: `Initiated OAuth for ${platform} (Client: ${clientId})`,
      metadata: { platform },
    })

    return NextResponse.json({ success: true, url: redirectUrl })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
