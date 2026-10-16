import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assertAdmin, denyForbidden, denyUnauthorized } from '@/lib/auth/guard'
import { logAudit } from '@/lib/audit/log'
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const assignUserSchema = z.object({
  clientId: z.string().min(1, 'Client ID wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  fullName: z.string().min(2, 'Nama pengguna minimal 2 karakter'),
  role: z.enum(['client', 'admin']).default('client'),
})

export async function GET(request: Request) {
  try {
    const admin = await assertAdmin()
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return NextResponse.json({ error: 'Parameter clientId wajib disertakan' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, client_id, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users: users || [] })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Akses ditolak'
    if (msg.includes('Unauthorized')) return denyUnauthorized()
    return denyForbidden({ reason: msg })
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(ip, 'admin/client-users', RATE_LIMITS.mutation.limit, RATE_LIMITS.mutation.windowMs)
  if (rl.limited) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    )
  }

  try {
    const admin = await assertAdmin()
    const body = await request.json()
    const parsed = assignUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Data tidak valid' },
        { status: 400 }
      )
    }

    const { clientId, email, fullName, role } = parsed.data
    const supabase = await createClient()

    // 1. Check if user already exists in public.users
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, client_id, role')
      .eq('email', email.toLowerCase().trim())
      .single()

    let resultUser

    if (existingUser) {
      // Update existing user binding
      const { data: updated, error: updateErr } = await supabase
        .from('users')
        .update({
          client_id: clientId,
          role,
          full_name: fullName,
        })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }
      resultUser = updated
    } else {
      // Insert new user record in public.users
      const { data: inserted, error: insertErr } = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase().trim(),
          full_name: fullName,
          role,
          client_id: clientId,
        })
        .select()
        .single()

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 })
      }
      resultUser = inserted
    }

    await logAudit({
      actorId: admin.userId,
      actorRole: 'admin',
      action: 'client.user_assigned',
      entityType: 'client_user',
      entityId: resultUser.id,
      summary: `Admin menautkan pengguna ${email} ke client ID ${clientId} dengan role ${role}`,
      metadata: {
        clientId,
        userEmail: email,
        fullName,
        role,
      },
      request,
    })

    return NextResponse.json({
      ok: true,
      user: resultUser,
      message: `Akses klien untuk ${email} berhasil dikonfigurasi.`,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Akses ditolak'
    if (msg.includes('Unauthorized')) return denyUnauthorized()
    return denyForbidden({ reason: msg })
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await assertAdmin()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const clientId = searchParams.get('clientId')

    if (!userId || !clientId) {
      return NextResponse.json({ error: 'userId dan clientId wajib diisi' }, { status: 400 })
    }

    const supabase = await createClient()

    // Unlink client_id and reset role to null
    const { error } = await supabase
      .from('users')
      .update({ client_id: null, role: null })
      .eq('id', userId)
      .eq('client_id', clientId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await logAudit({
      actorId: admin.userId,
      actorRole: 'admin',
      action: 'client.user_revoked',
      entityType: 'client_user',
      entityId: userId,
      summary: `Admin mencabut akses pengguna ${userId} dari client ${clientId}`,
      metadata: { clientId, userId },
      request,
    })

    return NextResponse.json({ ok: true, message: 'Akses klien berhasil dicabut.' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Akses ditolak'
    if (msg.includes('Unauthorized')) return denyUnauthorized()
    return denyForbidden({ reason: msg })
  }
}
