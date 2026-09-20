import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientWorkspace } from './workspace'

export const dynamic = 'force-dynamic'

/**
 * The platforms named in brand-profile.md, per the repo's own template.
 *
 * The template's "## Channels" section lists "**Active platforms:** ..." and "**Handles / links:**".
 * Skills write this section in the client's language, so the section heading and the field labels
 * vary (Taraju's profile has "## Channel & Operasional" / "### Platform Utama"). Rather than pin
 * one exact string, match the platform names themselves inside that section — they are the
 * stable part, and the repo's platform list is fixed (see tools/integrations/woopsocial.md).
 */
const BRIDGE_PLATFORMS = [
  'instagram', 'tiktok', 'youtube', 'facebook', 'linkedin',
  'twitter', 'x', 'pinterest', 'threads', 'bluesky',
]

function parseDeclaredChannels(brandProfile: string | undefined): string[] {
  if (!brandProfile) return []

  // Take the channels section: from a heading containing "channel" up to the next same-level
  // heading. Handles both "## Channels" and "## Channel & Operasional".
  const lines = brandProfile.split('\n')
  const start = lines.findIndex((l) => /^#{2,3}\s+.*channel/i.test(l))
  if (start === -1) return []

  const depth = (lines[start].match(/^#+/) ?? ['##'])[0].length
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#+)\s/)
    if (m && m[1].length <= depth) { end = i; break }
  }

  const section = lines.slice(start + 1, end).join('\n').toLowerCase()
  const found = BRIDGE_PLATFORMS.filter((p) =>
    p === 'x'
      // "x" alone is too noisy to match; require it as a word like "x/twitter"
      ? /\bx(\/twitter)?\b/.test(section)
      : new RegExp(`\\b${p}\\b`).test(section)
  )
  // X and Twitter are one platform; keep only "x" when both matched.
  return found.filter((p) => !(p === 'twitter' && found.includes('x')))
}

export default async function ClientWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, contact_email, contact_phone, brand_profile, created_at')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const [{ data: deliverables }, { data: packs }, { data: skills }, { data: links }, { data: clientSkills }, { data: files }, { data: stages }, { data: pSkills }, { data: guards }, { data: truths }, { data: channels }, { data: outputs }] =
    await Promise.all([
      supabase
        .from('deliverables')
        .select('id, title, type, status, updated_at')
        .eq('client_id', id)
        .order('updated_at', { ascending: false }),
      supabase.from('skill_packs').select('id, name, description, icon, sort_order').order('sort_order'),
      supabase.from('skills').select('id, name, description, category'),
      supabase.from('pack_skills').select('pack_id, skill_id'),
      supabase.from('client_skills').select('skill_id, status, notes').eq('client_id', id),
      supabase.from('client_files').select('path, content').eq('client_id', id),
      supabase.from('pipeline_stages').select('key, label, description, sort_order, chain, skill_order, publishes').order('sort_order'),
      supabase.from('skills').select('id, name, description, stage, reads_files, writes_files').order('name'),
      supabase.from('skill_guardrails').select('skill_id, kind, heading, body'),
      supabase.from('repo_ground_truths').select('source, rule').order('sort_order'),
      supabase.from('client_channels').select('platform, handle, status, note, confirmed_at').eq('client_id', id).order('platform'),
      supabase.from('skill_outputs').select('id, client_id, skill_id, stage, title, status, content, deliverable_id, created_at').eq('client_id', id).order('created_at', { ascending: false }),
    ])

  // the whole client folder as { path: content } so setup.tsx can show any artifact
  const fileMap: Record<string, string> = {}
  for (const f of files ?? []) fileMap[f.path] = f.content

  // Channels the repo already declared: brand-profile.md's "## Channels" section (its template
  // names "Active platforms", "Handles / links"). That document is the source of truth, so we
  // read the platforms from it and only overlay the bridge's connection state on top.
  const declaredChannels = parseDeclaredChannels(fileMap['brand-profile.md'])

  // Merge: every declared platform is a row; a client_channels row supplies connection state.
  const channelRows = declaredChannels.map((platform) => {
    const row = (channels ?? []).find(
      (c) => String(c.platform).toLowerCase() === platform.toLowerCase()
    )
    return {
      platform,
      handle: row?.handle ?? null,
      status: (row?.status ?? 'belum') as 'belum' | 'terhubung' | 'gagal',
      note: row?.note ?? null,
      confirmed_at: row?.confirmed_at ?? null,
    }
  })
  // ...plus any channel row the admin added for a platform the profile doesn't name yet.
  for (const c of channels ?? []) {
    if (!channelRows.some((r) => r.platform.toLowerCase() === String(c.platform).toLowerCase())) {
      channelRows.push({
        platform: String(c.platform),
        handle: c.handle ?? null,
        status: (c.status ?? 'belum') as 'belum' | 'terhubung' | 'gagal',
        note: c.note ?? null,
        confirmed_at: c.confirmed_at ?? null,
      })
    }
  }

  // the default AI provider, so the runner doesn't have to ask every time
  const { data: dflt } = await supabase
    .from('ai_providers').select('id, name, model').eq('is_default', true).maybeSingle()
  const defaultProvider = dflt ? { id: dflt.id, name: dflt.name, model: dflt.model } : null

  // group every skill under its pack so the UI can render a workspace per pack.
  // client_skills is the source of truth: a skill with no pack link must still show
  // (under "Tanpa Paket"), otherwise it becomes invisible and unrunnable.
  const skillById = new Map((skills ?? []).map((s) => [s.id, s]))
  const skillsByPack: Record<string, { id: string; name: string; description: string | null; category: string | null }[]> = {}
  for (const l of links ?? []) {
    const s = skillById.get(l.skill_id)
    if (!s) continue
    ;(skillsByPack[l.pack_id] ??= []).push({
      id: s.id, name: s.name, description: s.description, category: s.category,
    })
  }
  // packless skills the client owns — surface them so nothing is hidden
  const linkedSkillIds = new Set((links ?? []).map((l) => l.skill_id))
  const orphans = (clientSkills ?? [])
    .filter((c) => !linkedSkillIds.has(c.skill_id))
    .map((c) => skillById.get(c.skill_id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
  if (orphans.length > 0) {
    skillsByPack.__none__ = orphans.map((s) => ({
      id: s.id, name: s.name, description: s.description, category: s.category,
    }))
  }

  const packList = [
    ...(packs ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      icon: p.icon ?? null,
      skill_count: (skillsByPack[p.id] ?? []).length,
    })),
    ...(orphans.length > 0
      ? [{ id: '__none__', name: 'Tanpa Paket', description: 'Skill yang dipasang langsung tanpa paket', icon: null, skill_count: orphans.length }]
      : []),
  ]

  return (
    <ClientWorkspace
      client={{
        id: client.id,
        name: client.name,
        contact_email: client.contact_email,
        contact_phone: client.contact_phone,
        brand_profile: (client.brand_profile ?? {}) as Record<string, unknown>,
        created_at: client.created_at,
      }}
      deliverables={deliverables ?? []}
      packs={packList}
      skillsByPack={skillsByPack}
      clientSkills={(clientSkills ?? []) as { skill_id: string; status: 'belum' | 'jalan' | 'selesai'; notes: string | null }[]}
      pipelineStages={stages ?? []}
      pipelineSkills={pSkills ?? []}
      haveFiles={(files ?? []).map((f) => f.path)}
      providerId={defaultProvider?.id ?? undefined}
      allFiles={fileMap}
      provider={defaultProvider}
      guardrails={guards ?? []}
      groundTruths={truths ?? []}
      channels={channelRows}
      outputs={(outputs ?? []) as { id: string; client_id: string; skill_id: string; stage: string; title: string; status: string; content: string; deliverable_id: string | null; created_at: string }[]}
    />
  )
}
