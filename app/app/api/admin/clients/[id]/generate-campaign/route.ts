import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isResponse, resolveProvider, loadClientFiles } from '@/lib/ai/server'
import { chatJson } from '@/lib/ai/providers'

export const dynamic = 'force-dynamic'
export const maxDuration = 800

type GeneratedCampaign = {
  campaign: {
    title: string
    description: string
    objective?: string
    target_audience?: string
    status?: string
    start_date?: string
    end_date?: string
    color?: string
  }
  assets: {
    title: string
    description: string
    format: string
    asset_type: string
    posts: {
      platform: string
      visual_hook: string
      body_content: string
      post_type: string
    }[]
  }[]
}

// DB enums (migration 036): content_pillar_enum, funnel_stage_enum,
// platform_enum, post_format_enum, asset_status_enum
const PILLARS = ['Educational', 'Promotional', 'BehindTheScenes', 'IndustryInsights', 'Entertainment'] as const
const PLATFORMS = ['Instagram', 'LinkedIn', 'TikTok', 'Twitter', 'Facebook'] as const
const FORMATS = ['Reel', 'Carousel', 'SingleImage', 'Thread', 'TextPost', 'Story'] as const

function normalizePillar(v: string): string {
  const s = String(v || '').toLowerCase()
  return PILLARS.find((p) => p.toLowerCase() === s)
    || PILLARS.find((p) => s.includes(p.toLowerCase()))
    || 'Educational'
}

function normalizePlatform(v: string): string {
  const s = String(v || '').toLowerCase().replace(/[^a-z]/g, '')
  return PLATFORMS.find((p) => p.toLowerCase() === s)
    || PLATFORMS.find((p) => s.includes(p.toLowerCase()))
    || 'Instagram'
}

function normalizeFormat(v: string): string {
  const s = String(v || '').toLowerCase().replace(/[^a-z]/g, '')
  if (s.includes('reel') || s.includes('video')) return 'Reel'
  if (s.includes('carousel')) return 'Carousel'
  if (s.includes('thread')) return 'Thread'
  if (s.includes('story')) return 'Story'
  if (s.includes('text')) return 'TextPost'
  return 'SingleImage'
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx
  const clientId = params.id

  try {
    const { provider_id, topic, assetCount, platforms } = await request.json().catch(() => ({}))
    const count = assetCount || 2
    const targetPlatforms = (platforms && platforms.length > 0) ? platforms.join(', ') : 'INSTAGRAM, TIKTOK, FACEBOOK'
    const topicInstruction = topic ? `\nCRITICAL TOPIC INSTRUCTION: This campaign MUST strictly focus on this topic/theme: "${topic}"\n` : ''

    // 1. Resolve Provider
    const provider = await resolveProvider(supabase, provider_id)
    if (!provider) {
      return NextResponse.json(
        { error: 'Belum ada provider AI. Atur di /admin/settings/ai dulu.' },
        { status: 400 }
      )
    }

    // 2. Cek Klien & File Brand Profile
    const { data: client } = await supabase.from('clients').select('name').eq('id', clientId).single()
    if (!client) {
      return NextResponse.json({ error: 'Client tidak ditemukan' }, { status: 404 })
    }

    const files = await loadClientFiles(supabase, clientId)
    const brandProfile = files['brand-profile.md']
    
    if (!brandProfile) {
      return NextResponse.json(
        { error: 'Tolong selesaikan tahap Foundation (Brand Profile) di Client Setup terlebih dahulu.' },
        { status: 400 }
      )
    }

    // 3. Prompt AI
    const systemPrompt = `
You are an expert Social Media Campaign Planner and Content Creator.
Your task is to generate 1 monthly campaign, ${count} content assets for that campaign, and 2 platform posts for each asset.

CLIENT NAME: ${client.name}

--- BRAND PROFILE ---
${brandProfile}
--- END BRAND PROFILE ---
${topicInstruction}
CRITICAL INSTRUCTIONS:
- You must output ONLY a valid JSON object. No markdown fences like \`\`\`json. Just the raw JSON object.
- The JSON must match this structure exactly:
{
  "campaign": {
    "title": "String - Catchy campaign name",
    "description": "String - Summary of what this campaign is about",
    "objective": "String - Example: Awareness, Engagement, Lead Gen",
    "target_audience": "String - Specific audience based on brand profile",
    "status": "Draft"
  },
  "assets": [
    {
      "title": "String - Catchy asset idea",
      "description": "String - Detail of the asset idea",
      "format": "String - e.g. Single Image, Carousel, Reel",
      "asset_type": "String - e.g. Educational, Promotional, Entertainment",
      "posts": [
        {
          "platform": "String - MUST BE ONE OF: ${targetPlatforms}",
          "visual_hook": "String - Describe the image/video hook visually",
          "body_content": "String - The actual caption text with emojis and hashtags",
          "post_type": "String - e.g. Image, Video"
        }
      ]
    }
  ]
}
- Generate exactly 1 campaign.
- Inside 'assets', generate exactly ${count} asset items.
- Inside 'posts' for EACH asset, generate exactly 2 platform posts. The platform MUST be selected from: ${targetPlatforms}.
- Ensure the tone matches the Brand Profile perfectly.
`

    // 4. Generate AI
    const aiResult = await chatJson<GeneratedCampaign>(provider, systemPrompt, [
      { role: 'user', content: 'Tolong buatkan kampanye bulan depan beserta aset dan konten sosial medianya dalam format JSON sesuai instruksi.' }
    ])

    if (!aiResult || !aiResult.campaign || !aiResult.assets) {
      return NextResponse.json({ error: 'AI gagal menghasilkan format data yang valid. Silakan coba lagi.' }, { status: 502 })
    }

    // 5. Insert ke Database secara berurutan
    // A. Insert Campaign (use content_campaigns, the real table)
    const { data: campaignData, error: campaignError } = await supabase
      .from('content_campaigns')
      .insert({
        client_id: clientId,
        name: aiResult.campaign.title,
        type: 'campaign',
        start_date: aiResult.campaign.start_date ?? null,
        end_date: aiResult.campaign.end_date ?? null,
        color: aiResult.campaign.color ?? '#3b82f6',
        notes: aiResult.campaign.description ?? null,
      })
      .select('id')
      .single()

    if (campaignError || !campaignData) {
      throw new Error(`Gagal menyimpan kampanye: ${campaignError?.message}`)
    }

    const campaignId = campaignData.id

    // B. Insert Assets & Posts
    for (const asset of aiResult.assets) {
      const { data: assetData, error: assetError } = await supabase
        .from('content_assets')
        .insert({
          client_id: clientId,
          campaign_id: campaignId,
          title: asset.title,
          description: asset.description ?? null,
          content_pillar: normalizePillar(asset.asset_type),
          funnel_stage: 'TOFU',
          status: 'Idea',
        })
        .select('id')
        .single()

      if (assetError || !assetData) {
        throw new Error(`Gagal menyimpan aset: ${assetError?.message}`)
      }

      const assetId = assetData.id

      // C. Insert Posts
      for (const post of asset.posts) {
        const { error: postError } = await supabase
          .from('platform_posts')
          .insert({
            client_id: clientId,
            asset_id: assetId,
            platform: normalizePlatform(post.platform),
            format: normalizeFormat(asset.format),
            visual_hook: post.visual_hook ?? null,
            body_content: post.body_content ?? null,
            status: 'Draft',
          })

        if (postError) {
          throw new Error(`Gagal menyimpan post: ${postError?.message}`)
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Berhasil membuat kampanye AI.' })
  } catch (error: any) {
    console.error('Error generate AI Campaign:', error)
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
