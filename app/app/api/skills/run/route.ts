import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'
import { logAudit } from '@/lib/audit/log'
import { ExecuteGenericSkillSchema } from '@/features/skills/api/types'
import { executeGenericSkill } from '@/features/skills/api/service'
import { env } from '@/lib/env'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  const rl = checkRateLimit(
    getClientIp(request.headers),
    'skills/run',
    RATE_LIMITS.ai.limit,
    RATE_LIMITS.ai.windowMs
  )
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan AI. Coba lagi dalam beberapa detik.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    env.server.NEXT_PUBLIC_SUPABASE_URL!,
    env.server.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return denyUnauthorized()
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    void logAudit({
      actorId: user.id,
      action: 'skills.run.forbidden',
      summary: 'Non-admin user mencoba menjalankan skill generic runner',
      request,
    })
    return denyForbidden({ userId: user.id, role: profile?.role, route: 'api/skills/run' })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = ExecuteGenericSkillSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Payload tidak valid' },
      { status: 400 }
    )
  }

  const result = await executeGenericSkill(parsed.data)

  void logAudit({
    action: 'skills.run',
    actorId: user.id,
    clientId: parsed.data.clientId,
    summary: `Eksekusi playbook: ${parsed.data.skillId}`,
    metadata: {
      skillId: parsed.data.skillId,
      autoSave: parsed.data.autoSave,
      success: result.success,
    },
    request,
  })

  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
