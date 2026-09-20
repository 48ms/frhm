import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit/log'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

function normalizePlatform(p: string): string {
  // Map common variants to DB enum values
  const map: Record<string, string> = {
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    twitter: 'Twitter',
    twitterx: 'Twitter',
    tiktok: 'TikTok',
    x: 'Twitter',
  }
  return map[p.toLowerCase().trim()] ?? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
}

function normalizeFormat(f: string): string {
  const map: Record<string, string> = {
    reel: 'Reel',
    carouse: 'Carousel',
    singleimage: 'SingleImage',
    singleimagepost: 'SingleImage',
    thread: 'Thread',
    textpost: 'TextPost',
    text: 'TextPost',
    story: 'Story',
  }
  return map[f.toLowerCase().trim()] ?? f.charAt(0).toUpperCase() + f.slice(1).toLowerCase()
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, client_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return denyForbidden()

  const body = await request.json()
  const {
    client_id,
    asset_id,
    platform,
    format,
    visual_hook,
    body_content,
    call_to_action,
    campaign_id,
  } = body

  if (!client_id || !platform || !body_content) {
    return NextResponse.json({ error: 'client_id, platform, dan body_content wajib diisi' }, { status: 400 })
  }

  const normalizedPlatform = normalizePlatform(platform)
  const normalizedFormat = format ? normalizeFormat(format) : null

  const { data, error } = await supabase
    .from('platform_posts')
    .insert({
      client_id,
      asset_id: asset_id || null,
      platform: normalizedPlatform,
      format: normalizedFormat,
      visual_hook: visual_hook || null,
      body_content: body_content.trim(),
      call_to_action: call_to_action || null,
      campaign_id: campaign_id || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit({
    actorId: user.id,
    actorRole: 'admin',
    actorName: profile?.full_name || 'Admin',
    action: 'platform_post.create',
    entityType: 'platform_post',
    entityId: data.id,
    clientId: client_id,
    summary: `Buat postingan ${normalizedPlatform} untuk asset ${asset_id || 'baru'}`,
    metadata: { platform: normalizedPlatform, format: normalizedFormat },
  })

  return NextResponse.json({ post: data })
}
