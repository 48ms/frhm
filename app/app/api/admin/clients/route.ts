import { createServerClient } from '@supabase/ssr'
// eslint-disable-next-line no-restricted-imports
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit/log'
import { resolveProvider } from '@/lib/ai/server'
import { chatJson } from '@/lib/ai/providers'
import { NICHE_PACK_MAP, buildBrandProfilePrompt, type NicheId } from '@/lib/onboarding/niche-packs'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { denyUnauthorized, denyForbidden } from '@/lib/auth/guard'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  if (searchParams.get('all') === 'true') {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return denyUnauthorized()
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return denyForbidden({ userId: user.id, role: profile?.role })

    // Pagination: ?page=N&limit=M (default 50, max 100)
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const rawLimit = parseInt(searchParams.get('limit') ?? '50', 10) || 50
    const limit = Math.min(Math.max(1, rawLimit), 100)
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('clients')
      .select('id, name', { count: 'exact' })
      .order('name')
      .range(from, to)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ clients: data ?? [], total: count ?? 0, page, limit })
  }
  return NextResponse.json({ error: 'Bad request' }, { status: 400 })
}

export async function POST(request: Request) {
  const rl = checkRateLimit(getClientIp(request.headers), 'admin/clients', RATE_LIMITS.mutation.limit, RATE_LIMITS.mutation.windowMs)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi dalam beberapa detik.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch { /* server component */ }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return denyForbidden()
  }

  const body = await request.json().catch(() => ({}))
  const name: string = (body?.name ?? '').trim()
  const contact_email: string | null = body?.contact_email?.trim() || null
  const contact_phone: string | null = body?.contact_phone?.trim() || null
  // Marketing foundation inputs (optional — backward compatible with old payloads)
  const niche: NicheId | null = (body?.niche ?? null) as NicheId | null
  const target_audience: string = (body?.target_audience ?? '').trim()
  const products: string = (body?.products ?? '').trim()
  const usp: string = (body?.usp ?? '').trim()

  if (!name) return NextResponse.json({ error: 'Nama client wajib diisi' }, { status: 400 })

  const { data, error } = await supabase
    .from('clients')
    .insert({ name, contact_email, contact_phone })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const clientId = (data as { id: string }).id

  // If an email is given, also provision the client's login account so they can review
  // deliverables the moment they're sent. The password is random; shown once to the admin.
  let credentials: { email: string; password: string } | null = null

  if (contact_email) {
    const password = genPassword()
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
    // 1) create the auth user (role metadata so handle_new_user() seeds public.users)
    const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
      email: contact_email,
      password,
      email_confirm: true,
      user_metadata: { role: 'client', full_name: name },
    })
    if (authErr) {
      // roll back the client row — a client without a login account is worse than no client
      await supabase.from('clients').delete().eq('id', clientId)
      return NextResponse.json({ error: `Gagal membuat akun client: ${authErr.message}` }, { status: 400 })
    }
    const authUserId = (authUser as { user: { id: string } }).user.id
    // 2) link the auth user to this client record (public.users.client_id)
    const { error: linkErr } = await admin
      .from('users')
      .update({ client_id: clientId, role: 'client' })
      .eq('id', authUserId)
    if (linkErr) {
      await supabase.from('clients').delete().eq('id', clientId)
      return NextResponse.json({ error: `Gagal menautkan akun: ${linkErr.message}` }, { status: 400 })
    }
    credentials = { email: contact_email, password }
  }

  // --- Smart Onboarding: AI brand-profile synthesis + skill pack seeding ---
  // Non-fatal: a client without a brand profile is still usable, so we never roll back
  // a successful creation over an AI hiccup (unlike the auth-user failure above).
  let brandProfileGenerated = false
  let brandProfileReason: string | null = null
  let seededSkillCount = 0

  if (niche) {
    // 1. Seed skill packs from the niche map (deterministic, no AI needed)
    try {
      const packSlugs = NICHE_PACK_MAP[niche] ?? NICHE_PACK_MAP.other
      const { data: packRows } = await supabase
        .from('pack_skills')
        .select('skill_id')
        .in('pack_id', packSlugs)
      const skillIds = Array.from(new Set((packRows ?? []).map((r: { skill_id: string }) => r.skill_id)))
      if (skillIds.length) {
        const { error: seedErr } = await supabase
          .from('client_skills')
          .upsert(
            skillIds.map((skill_id) => ({ client_id: clientId, skill_id, status: 'belum' as const })),
            { onConflict: 'client_id,skill_id', ignoreDuplicates: true }
          )
        if (!seedErr) seededSkillCount = skillIds.length
      }
    } catch (e) {
      console.error('Skill seeding failed (non-fatal):', e)
    }

    // 2. Synthesize brand-profile.md via the configured AI provider
    try {
      const provider = await resolveProvider(supabase)
      if (!provider) {
        brandProfileReason = 'Belum ada provider AI. Atur di /admin/settings/ai lalu generate ulang di Client Setup.'
      } else {
        const prompt = buildBrandProfilePrompt(name, niche, target_audience, products, usp)
        const aiResult = await chatJson<{ brand_profile_md: string }>(provider, prompt, [
          { role: 'user', content: 'Generate the brand-profile.md document as JSON now.' },
        ])
        const md = aiResult?.brand_profile_md?.trim()
        if (!md) {
          brandProfileReason = 'AI tidak mengembalikan dokumen yang valid.'
        } else {
          const { error: fileErr } = await supabase
            .from('client_files')
            .upsert(
              { client_id: clientId, path: 'brand-profile.md', content: md, updated_at: new Date().toISOString() },
              { onConflict: 'client_id,path' }
            )
          if (fileErr) {
            brandProfileReason = `Gagal menyimpan brand profile: ${fileErr.message}`
          } else {
            brandProfileGenerated = true
          }
        }
      }
    } catch (e) {
      brandProfileReason = e instanceof Error ? e.message : 'Gagal generate brand profile.'
      console.error('Brand profile synthesis failed (non-fatal):', e)
    }
  }

  await logAudit({
    actorId: user.id,
    actorRole: 'admin',
    action: 'client.create',
    entityType: 'client',
    entityId: clientId,
    clientId,
    summary: credentials
      ? `Admin membuat client "${name}" beserta akun login (${contact_email})`
      : `Admin membuat client "${name}" (tanpa akun login)`,
    // never the password
    metadata: {
      name,
      contact_email: contact_email ?? null,
      has_login: Boolean(credentials),
      niche: niche ?? null,
      brand_profile_generated: brandProfileGenerated,
      seeded_skills: seededSkillCount,
    },
  })

  return NextResponse.json(
    { success: true, data, credentials, brandProfileGenerated, brandProfileReason, seededSkillCount },
    { status: 201 }
  )
}

/** 12-char random password — shown exactly once, never stored. */
function genPassword(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  const rand = new Uint8Array(12)
  crypto.getRandomValues(rand)
  for (const b of rand) out += alphabet[b % alphabet.length]
  return out
}
