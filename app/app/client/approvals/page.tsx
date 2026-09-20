import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApprovalBoard } from '@/components/client/approval-board'

export const dynamic = 'force-dynamic'

export default async function ClientApprovalsPage() {
  const supabase = await createClient()

  // 1. Verify Authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/client/approvals')

  // 2. Verify Profile and Client Association
  const { data: profile } = await supabase
    .from('users')
    .select('role, client_id')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'client') redirect('/admin/dashboard')
  
  const clientId = profile.client_id
  if (!clientId) redirect('/client/dashboard')

  // 3. Fetch Campaigns for this client
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name')
    .eq('client_id', clientId)

  let postsData: any[] = []

  if (campaigns && campaigns.length > 0) {
    const campaignIds = campaigns.map(c => c.id)
    const campaignMap = new Map(campaigns.map(c => [c.id, c.name]))

    // 4. Fetch Assets (defense-in-depth: also scope by client_id)
    const { data: assets } = await supabase
      .from('content_assets')
      .select('id, title, description, campaign_id')
      .eq('client_id', clientId)
      .in('campaign_id', campaignIds)

    if (assets && assets.length > 0) {
      const assetIds = assets.map(a => a.id)
      const assetMap = new Map(assets.map(a => [a.id, a]))

      // 5. Fetch Posts that are InReview or Approved (defense-in-depth: scope by client_id)
      const { data: platformPosts } = await supabase
        .from('platform_posts')
        .select('id, asset_id, platform, format, scheduled_at, status, body_content, visual_hook, call_to_action')
        .eq('client_id', clientId)
        .in('asset_id', assetIds)
        .in('status', ['InReview', 'Approved'])
        .order('scheduled_at', { ascending: true })

      if (platformPosts) {
        postsData = platformPosts.map(p => {
          const assetInfo = assetMap.get(p.asset_id)
          return {
            id: p.id,
            platform: p.platform,
            format: p.format,
            scheduled_at: p.scheduled_at,
            status: p.status,
            body_content: p.body_content,
            visual_hook: p.visual_hook,
            call_to_action: p.call_to_action,
            asset: {
              title: assetInfo?.title || 'Untitled',
              description: assetInfo?.description || null,
              campaign_name: assetInfo ? campaignMap.get(assetInfo.campaign_id) || 'Unknown Campaign' : 'Unknown Campaign'
            }
          }
        })
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl w-full">
      <ApprovalBoard initialPosts={postsData} clientId={clientId} />
    </div>
  )
}
