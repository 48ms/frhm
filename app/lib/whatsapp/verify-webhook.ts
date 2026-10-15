/**
 * Verifikasi webhook WhatsApp (fail-closed).
 * Mendukung handshake GET (Meta WhatsApp Cloud API / Webhook provider)
 * dan verifikasi token/secret pada request inbound.
 */

import { env } from '@/lib/env'

export interface WhatsAppWebhookVerificationResult {
  ok: boolean
  challenge?: string
  reason?: string
}

export function verifyWhatsAppWebhookGet(
  configuredVerifyToken: string | undefined,
  mode: string | null,
  token: string | null,
  challenge: string | null
): WhatsAppWebhookVerificationResult {
  if (!configuredVerifyToken) {
    return { ok: false, reason: 'not_configured' }
  }

  if (mode !== 'subscribe') {
    return { ok: false, reason: 'invalid_mode' }
  }

  if (!token || token !== configuredVerifyToken) {
    return { ok: false, reason: 'token_mismatch' }
  }

  if (!challenge) {
    return { ok: false, reason: 'missing_challenge' }
  }

  return { ok: true, challenge }
}

export function verifyWhatsAppWebhookPost(
  configuredSecret: string | undefined,
  receivedSecret: string | null
): { ok: boolean; reason?: string } {
  // Jika secret di-set di env, wajib cocok (fail-closed).
  // Jika tidak di-set di development/test, beri izin jika env bukan production.
  if (!configuredSecret) {
    if (env.server.NODE_ENV === 'production') {
      return { ok: false, reason: 'secret_not_configured_in_production' }
    }
    return { ok: true }
  }

  if (!receivedSecret) {
    return { ok: false, reason: 'missing_secret_header' }
  }

  if (receivedSecret !== configuredSecret) {
    return { ok: false, reason: 'secret_mismatch' }
  }

  return { ok: true }
}
