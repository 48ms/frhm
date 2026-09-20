import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Provider } from './providers'
import { logger } from '@/lib/logger'

export async function serverSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
  const q = supabase.from('ai_providers').select('kind, model, base_url, api_key')
  const { data } = providerId
    ? await q.eq('id', providerId).maybeSingle()
    : await q.eq('is_default', true).maybeSingle()
  return (data as Provider | null) ?? null
}

/** The skill's original SKILL.md, verbatim. */
export async function loadSkillMd(
  supabase: AdminCtx['supabase'],
  skillId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('skill_files')
    .select('content')
    .eq('skill_id', skillId)
    .eq('path', 'SKILL.md')
    .maybeSingle()
  return data?.content ?? null
}

/** The client's brand files, as { path: content }, for prompt context. */
export async function loadClientFiles(
  supabase: AdminCtx['supabase'],
  clientId: string
): Promise<Record<string, string>> {
  const { data } = await supabase
    .from('client_files')
    .select('path, content')
    .eq('client_id', clientId)
  const out: Record<string, string> = {}
  for (const r of data ?? []) out[r.path] = r.content
  return out
}

export function brandContext(name: string, files: Record<string, string>): string {
  const bp = files['brand-profile.md']
  if (bp) return bp
  return `# Brand Profile — ${name}\n\n(belum ada brand-profile.md; buat dulu sebelum skill lain dijalankan)`
}
