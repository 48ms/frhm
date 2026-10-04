/**
 * Verifikasi Authorization header untuk cron trigger (fail-closed).
 *
 * Sebelumnya setiap route cron memakai `process.env.CRON_SECRET || 'test_cron_secret'`.
 * Jika `CRON_SECRET` tidak diset di produksi, secret jatuh ke literal yang bisa ditebak
 * (`test_cron_secret`) — siapa pun bisa memicu publish/reminder. Helper ini menolak
 * (fail-closed) ketika `CRON_SECRET` kosong, dan memakai perbandingan constant-time.
 */
import { timingSafeEqual } from 'node:crypto'

export function verifyCronSecret(
  configuredSecret: string | undefined,
  authHeader: string | null,
): { ok: boolean; reason?: string } {
  if (!configuredSecret) {
    return { ok: false, reason: 'not_configured' }
  }
  if (!authHeader) {
    return { ok: false, reason: 'missing_header' }
  }

  const expected = `Bearer ${configuredSecret}`
  const a = Buffer.from(authHeader)
  const b = Buffer.from(expected)
  if (a.length !== b.length) {
    return { ok: false, reason: 'mismatch' }
  }
  if (!timingSafeEqual(a, b)) {
    return { ok: false, reason: 'mismatch' }
  }
  return { ok: true }
}
