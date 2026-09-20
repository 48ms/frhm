import { NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'

export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const clientId = params.id
  const { skill_id, title, content } = await req.json()

  if (!skill_id || !content) {
    return NextResponse.json(
      { error: 'skill_id dan content wajib diisi' },
      { status: 400 },
    )
  }

  // Determine the stage this skill belongs to. The stage is denormalised into skill_outputs so the
  // Hasil tab can group without joining through skill_groups. Stage lives on `skills`, not
  // `client_skills`.
  const { data: skillRow } = await supabase
    .from('skills')
    .select('stage, name')
    .eq('id', skill_id)
    .maybeSingle()
  const stage = skillRow?.stage ?? 'plan'

  // Persist to skill_outputs so it appears in the Hasil tab
  const { data: skillOutput, error: outputError } = await supabase
    .from('skill_outputs')
    .insert({
      client_id: clientId,
      skill_id,
      stage,
      title: title || skillRow?.name || skill_id,
      content,
      status: 'draft',
    })
    .select()
    .single()

  if (outputError) {
    return NextResponse.json({ error: outputError.message }, { status: 500 })
  }

  if (skill_id === 'campaign-and-launch-planning') {
    // Try to extract campaign name from the content. The skill output usually has a heading.
    const lines = String(content).split('\n')
    const titleLine = lines.find(l => /^#\s*/.test(l))
    const extractedName = titleLine ? titleLine.replace(/^#\s*/, '').trim() : `Kampanye ${new Date().toLocaleDateString('id-ID')}`

    const { data: existingCampaign } = await supabase
      .from('content_campaigns')
      .select('id')
      .eq('client_id', clientId)
      .eq('name', extractedName)
      .maybeSingle()

    if (!existingCampaign) {
      const { error: campaignError } = await supabase
        .from('content_campaigns')
        .insert({
          client_id: clientId,
          name: extractedName,
          type: 'campaign',
          notes: `Auto-generated from campaign-and-launch-planning skill output`,
        })
      if (campaignError) {
        console.error('Failed to auto-create campaign:', campaignError.message)
      }
    }
  }

  return NextResponse.json({ ok: true, output: skillOutput })
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const clientId = params.id

  const { data, error } = await supabase
    .from('skill_outputs')
    .select('id, skill_id, stage, title, status, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ outputs: data })
}
