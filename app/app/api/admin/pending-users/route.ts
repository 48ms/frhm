import { NextResponse } from 'next/server'
import { assertAdmin, denyForbidden, denyUnauthorized } from '@/lib/auth/guard'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { logAudit } from '@/lib/audit/log'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export interface PendingUser {
  id: string
  email: string
  fullName: string
  avatarUrl?: string | null
  provider: string
  createdAt: string
  lastSignInAt?: string | null
  role: string | null
  clientId: string | null
}

const approveUserSchema = z.object({
  userId: z.string().uuid('User ID harus berupa UUID valid'),
  role: z.enum(['admin', 'client']),
  clientId: z.string().uuid('Client ID harus berupa UUID valid').optional().nullable(),
})

export async function GET(request: Request) {
  try {
    await assertAdmin()
    const serviceClient = createSupabaseServiceClient()

    const [{ data: authUsersRes, error: authErr }, { data: publicUsers, error: publicErr }, { data: clients }] =
      await Promise.all([
        serviceClient.auth.admin.listUsers({ perPage: 100 }),
        serviceClient.from('users').select('*'),
        serviceClient.from('clients').select('id, name'),
      ])

    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 500 })
    }

    const publicMap = new Map((publicUsers ?? []).map((p) => [p.id, p]))
    const clientMap = new Map((clients ?? []).map((c) => [c.id, c.name]))

    const authList = authUsersRes?.users ?? []

    // Filter pending users: role is not 'admin' AND client_id is null
    const pendingUsers: PendingUser[] = []

    for (const au of authList) {
      const pub = publicMap.get(au.id)
      const role = pub?.role ?? (au.user_metadata?.role as string) ?? null
      const clientId = pub?.client_id ?? null

      // If user is already active admin or has an assigned client_id, they are not pending
      if (role === 'admin' || clientId) {
        continue
      }

      const rawMeta = au.user_metadata || {}
      const provider =
        (au.app_metadata?.provider as string) ||
        (rawMeta.iss?.includes('google') ? 'google' : 'email')

      pendingUsers.push({
        id: au.id,
        email: au.email ?? '',
        fullName:
          pub?.full_name ||
          rawMeta.full_name ||
          rawMeta.name ||
          (au.email ? au.email.split('@')[0] : 'Pengguna Baru'),
        avatarUrl: pub?.avatar_url || rawMeta.avatar_url || rawMeta.picture || null,
        provider,
        createdAt: au.created_at,
        lastSignInAt: au.last_sign_in_at || null,
        role: role ?? 'client',
        clientId: null,
      })
    }

    return NextResponse.json({
      pendingUsers,
      count: pendingUsers.length,
      clients: clients ?? [],
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Akses ditolak'
    if (msg.includes('Unauthorized')) return denyUnauthorized()
    return denyForbidden({ reason: msg })
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(ip, 'admin/pending-users', RATE_LIMITS.mutation.limit, RATE_LIMITS.mutation.windowMs)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  try {
    const admin = await assertAdmin()
    const body = await request.json()
    const parsed = approveUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      )
    }

    const { userId, role, clientId } = parsed.data

    if (role === 'client' && !clientId) {
      return NextResponse.json(
        { error: 'Pilih Brand Klien untuk menautkan pengguna ber-role Klien.' },
        { status: 400 }
      )
    }

    const serviceClient = createSupabaseServiceClient()

    // Ambil info auth user
    const { data: userData, error: getUserErr } = await serviceClient.auth.admin.getUserById(userId)
    if (getUserErr || !userData.user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan di sistem auth.' }, { status: 404 })
    }

    const targetEmail = userData.user.email ?? ''
    const rawMeta = userData.user.user_metadata || {}
    const fullName = rawMeta.full_name || rawMeta.name || targetEmail.split('@')[0]
    const avatarUrl = rawMeta.avatar_url || rawMeta.picture || null

    // Upsert into public.users
    const effectiveClientId = role === 'admin' ? null : clientId
    const { error: upsertErr } = await serviceClient
      .from('users')
      .upsert({
        id: userId,
        role,
        client_id: effectiveClientId,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })

    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 })
    }

    // Ambil nama klien jika ada
    let clientName = ''
    if (effectiveClientId) {
      const { data: c } = await serviceClient
        .from('clients')
        .select('name')
        .eq('id', effectiveClientId)
        .single()
      clientName = c?.name ?? ''
    }

    await logAudit({
      actorId: admin.userId,
      actorRole: 'admin',
      action: 'client.user_assigned',
      entityType: 'client_user',
      entityId: userId,
      summary: `Admin menyetujui akun ${targetEmail} sebagai ${role === 'admin' ? 'Admin Agensi' : `Klien Partner (${clientName})`}`,
      metadata: {
        userId,
        email: targetEmail,
        role,
        clientId: effectiveClientId,
        clientName,
      },
      request,
    })

    return NextResponse.json({
      ok: true,
      message: `Akun ${targetEmail} berhasil disetujui sebagai ${role === 'admin' ? 'Admin Agensi' : `Klien Partner (${clientName})`}.`,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menyetujui pengguna'
    if (msg.includes('Unauthorized')) return denyUnauthorized()
    return denyForbidden({ reason: msg })
  }
}
