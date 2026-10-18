import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Provider } from './providers'
import { logger } from '@/lib/logger'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { brandProfileToMarkdown, compileBrandContext } from '@/lib/brand-context'
import fs from 'fs'
import path from 'path'
import { env } from '@/lib/env'

export async function serverSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    env.server.NEXT_PUBLIC_SUPABASE_URL,
    env.server.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cs) {
          try {
            cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
}

export type AdminCtx = {
  supabase: Awaited<ReturnType<typeof serverSupabase>>
  userId: string
}

/** Returns the admin auth context, or a NextResponse to short-circuit with. */
export async function requireAdmin(): Promise<AdminCtx | NextResponse> {
  const supabase = await serverSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    // Security event: unauthenticated attempt to reach an admin route (O-security-events).
    logger.warn('security.unauthorized', { route: 'requireAdmin', reason: 'no_session' })
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    // Security event: authenticated but insufficient privilege (privilege escalation attempt).
    logger.warn('security.forbidden', {
      route: 'requireAdmin',
      reason: 'not_admin',
      userId: user.id,
      role: profile?.role ?? 'none',
    })
    return NextResponse.json({ error: 'Hanya admin' }, { status: 403 })
  }
  return { supabase, userId: user.id }
}

export function isResponse(x: unknown): x is NextResponse {
  return x instanceof NextResponse
}

export async function resolveProvider(
  supabase: AdminCtx['supabase'],
  providerId?: string
): Promise<Provider | null> {
  const admin = createSupabaseServiceClient()
  const q = admin.from('ai_providers').select('kind, model, base_url, api_key')
  const { data } = providerId
    ? await q.eq('id', providerId).maybeSingle()
    : await q.eq('is_default', true).maybeSingle()
  return (data as Provider | null) ?? null
}

/** Loads the skill's SKILL.md and key reference playbook documents from skill_files. */
export async function loadSkillBundle(
  supabase: AdminCtx['supabase'],
  skillId: string
): Promise<string | null> {
  const admin = createSupabaseServiceClient()
  const { data } = await admin
    .from('skill_files')
    .select('path, content')
    .eq('skill_id', skillId)

  if (!data || data.length === 0) {
    // Resilient fallback to local cloned social-media-skills repository
    try {
      const candidateDirs = [
        path.resolve(process.cwd(), '..', 'social-media-skills', 'skills', skillId),
        path.resolve(process.cwd(), 'social-media-skills', 'skills', skillId),
      ]
      const localDir = candidateDirs.find((d) => fs.existsSync(d))
      if (localDir) {
        const skillMdPath = path.join(localDir, 'SKILL.md')
        const skillMd = fs.existsSync(skillMdPath) ? fs.readFileSync(skillMdPath, 'utf8') : ''
        const refDir = path.join(localDir, 'references')
        const refSections: string[] = []
        if (fs.existsSync(refDir)) {
          const files = fs.readdirSync(refDir)
          for (const file of files) {
            if (file.endsWith('.md')) {
              const content = fs.readFileSync(path.join(refDir, file), 'utf8')
              refSections.push(`### [Reference: references/${file}]\n${content}`)
            }
          }
        }
        if (refSections.length === 0) return skillMd || null
        return `${skillMd}\n\n---\n## Authoritative Playbook References & Rules\n\n${refSections.join('\n\n---\n\n')}`
      }
    } catch {
      // ignore
    }
    return null
  }

  const skillFile = data.find((f: { path: string }) => f.path === 'SKILL.md')
  const skillMd = skillFile?.content ?? ''

  // Collect reference files up to a rich context budget (references/*.md)
  const refFiles = data.filter(
    (f: { path: string; content?: string }) => f.path.startsWith('references/') && f.content?.trim()
  )

  if (refFiles.length === 0) {
    return skillMd || null
  }

  const refSections = refFiles
    .map((f: { path: string; content: string }) => `### [Reference: ${f.path}]\n${f.content}`)
    .join('\n\n---\n\n')

  return `${skillMd}\n\n---\n## Authoritative Playbook References & Rules\n\n${refSections}`
}

/** The skill's original SKILL.md, or loaded bundle. */
export async function loadSkillMd(
  supabase: AdminCtx['supabase'],
  skillId: string
): Promise<string | null> {
  return loadSkillBundle(supabase, skillId)
}

/** The client's brand files, as { path: content }, for prompt context. */
export async function loadClientFiles(
  supabase: AdminCtx['supabase'],
  clientId: string
): Promise<Record<string, string>> {
  const admin = createSupabaseServiceClient()
  const { data } = await admin
    .from('client_files')
    .select('path, content')
    .eq('client_id', clientId)
  const out: Record<string, string> = {}
  for (const r of data ?? []) out[r.path] = r.content

  // Resilient fallback: jika ada foundation files yang belum ada di client_files tapi clients.brand_profile ada di DB
  const needsProfile = !out['brand-profile.md'] || !out['brand-profile.md'].trim()
  const needsVoice = !out['voice.md'] || !out['voice.md'].trim()
  const needsPillars = !out['content-pillars.md'] || !out['content-pillars.md'].trim()
  const needsGuardrails = !out['guardrails.md'] || !out['guardrails.md'].trim()
  const needsAudience = !out['audience.md'] || !out['audience.md'].trim()
  const needsOffers = !out['offers.md'] || !out['offers.md'].trim()

  if (needsProfile || needsVoice || needsPillars || needsGuardrails || needsAudience || needsOffers) {
    try {
      const { data: clientRow } = await admin
        .from('clients')
        .select('name, brand_profile')
        .eq('id', clientId)
        .maybeSingle()

      if (clientRow?.brand_profile && typeof clientRow.brand_profile === 'object') {
        const bp = clientRow.brand_profile as Record<string, any>
        const cName = clientRow.name || 'Client'

        if (needsProfile && (bp.who || bp.identity || bp.voice || bp.audience || bp.pov || bp.guardrails)) {
          out['brand-profile.md'] = brandProfileToMarkdown(bp, cName)
        }
        if (needsVoice && bp.voice && typeof bp.voice === 'string' && bp.voice.trim()) {
          out['voice.md'] = `# Brand Voice & Tone Guide — ${cName}\n\n## Tone of Voice\n${bp.voice.trim()}`
        }
        if (needsAudience && bp.audience && typeof bp.audience === 'string' && bp.audience.trim()) {
          out['audience.md'] = `# Target Audience & ICP — ${cName}\n\n## Audience Persona\n${bp.audience.trim()}`
        }
        if (needsPillars && Array.isArray(bp.pillars) && bp.pillars.length > 0) {
          out['content-pillars.md'] = `# Content Pillars & Focus Areas — ${cName}\n\n${bp.pillars
            .map((p: string) => (p.startsWith('-') ? p : `- ${p}`))
            .join('\n')}`
        }
        if (needsGuardrails && bp.guardrails && typeof bp.guardrails === 'string' && bp.guardrails.trim()) {
          out['guardrails.md'] = `# Brand Guardrails & Never-List — ${cName}\n\n## Never-List & Restrictions\n${bp.guardrails.trim()}`
        }
        if (needsOffers && bp.offers_ctas && typeof bp.offers_ctas === 'string' && bp.offers_ctas.trim()) {
          out['offers.md'] = `# Offers & Product Catalog — ${cName}\n\n## Offers & CTAs\n${bp.offers_ctas.trim()}`
        }
      }
    } catch (fallbackErr: unknown) {
      logger.warn('loadClientFiles.fallback_failed', {
        clientId,
        error: fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr),
      })
    }
  }

  return out
}

export function brandContext(name: string, files: Record<string, string>): string {
  return compileBrandContext(name, files)
}
