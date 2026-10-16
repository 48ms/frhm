import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

/**
 * Central security-event helpers for 401/403 responses.
 *
 * Every route that rejects an unauthenticated or unauthorized request should
 * call these instead of constructing the raw NextResponse, so that the
 * rejection is logged once, in one place, with a consistent shape.
 *
 * Usage:
 *   if (!user) return denyUnauthorized()
 *   if (profile?.role !== 'admin') return denyForbidden({ userId: user.id, role: profile?.role })
 */

export type SecurityContext = {
  route?: string
  userId?: string
  role?: string | null
  reason?: string
  [key: string]: unknown
}

export function denyUnauthorized(ctx: SecurityContext = {}): NextResponse {
  logger.warn('security.unauthorized', {
    route: ctx.route ?? 'unknown',
    reason: ctx.reason ?? 'no_session',
    userId: ctx.userId,
  })
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function denyForbidden(ctx: SecurityContext = {}): NextResponse {
  logger.warn('security.forbidden', {
    route: ctx.route ?? 'unknown',
    reason: ctx.reason ?? 'insufficient_role',
    userId: ctx.userId,
    role: ctx.role,
  })
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

/**
 * Memverifikasi sesi aktif dan memastikan user memiliki role 'admin'.
 * Throw fail-closed jika tidak terautentikasi atau bukan admin.
 */
export async function assertAdmin(): Promise<{ userId: string }> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    logger.warn('security.unauthorized', { route: 'assertAdmin', reason: 'no_session' })
    throw new Error('Unauthorized: tidak ada sesi aktif')
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    logger.warn('security.forbidden', {
      route: 'assertAdmin',
      reason: 'not_admin',
      userId: user.id,
      role: profile?.role ?? 'none',
    })
    throw new Error('Forbidden: hanya administrator yang memiliki akses')
  }

  return { userId: user.id }
}

/**
 * Memverifikasi batas multi-tenant (Pillar 1).
 * Admin dapat mengakses seluruh klien.
 * Klien biasa HANYA dapat mengakses clientId yang sesuai dengan user.client_id.
 */
export async function assertClientAccess(
  clientId: string,
): Promise<{ userId: string; role: string; clientId: string }> {
  if (!clientId) {
    throw new Error('Client ID wajib disertakan')
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    logger.warn('security.unauthorized', { route: 'assertClientAccess', reason: 'no_session' })
    throw new Error('Unauthorized: tidak ada sesi aktif')
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, client_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    logger.warn('security.forbidden', {
      route: 'assertClientAccess',
      reason: 'profile_not_found',
      userId: user.id,
    })
    throw new Error('Forbidden: profil pengguna tidak ditemukan')
  }

  const isAdmin = profile.role === 'admin'
  if (!isAdmin && profile.client_id !== clientId) {
    logger.warn('security.forbidden', {
      route: 'assertClientAccess',
      reason: 'cross_tenant_access_denied',
      userId: user.id,
      userClientId: profile.client_id,
      targetClientId: clientId,
    })
    throw new Error('Forbidden: Anda tidak memiliki akses ke klien ini')
  }

  return { userId: user.id, role: profile.role, clientId }
}