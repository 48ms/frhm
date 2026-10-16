/**
 * Verifikasi secret token webhook Telegram (fail-closed).
 *
 * Telegram mengirim secret yang kita set saat `setWebhook` pada header
 * `X-Telegram-Bot-Api-Secret-Token`. Tanpa verifikasi ini, siapa pun yang tahu
 * URL webhook bisa memalsukan payload `/start client_<id>` dan membajak
 * penautan Telegram milik klien (route memakai service-role client).
 *
 * Aturan: jika `TELEGRAM_BOT_SECRET_TOKEN` belum dikonfigurasi, TOLAK request
 * (fail-closed) — jangan pernah menerima webhook tanpa secret di produksi.
 */
import { timingSafeEqual } from 'node:crypto'

export function verifyTelegramWebhookSecret(
  configuredSecret: string | undefined,
  receivedSecret: string | null,
): { ok: boolean; reason?: string } {
  if (!configuredSecret) {
    return { ok: false, reason: 'not_configured' }
  }
  if (!receivedSecret) {
    return { ok: false, reason: 'missing_header' }
  }

  const a = Buffer.from(receivedSecret)
  const b = Buffer.from(configuredSecret)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'mismatch' }
  }

  return { ok: true }
}
