import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

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