import { createHmac, timingSafeEqual } from "node:crypto"
import { env } from "@/lib/env"

export const REVIEW_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60

function getSecret(): string | null {
  const secret = env.server.REVIEW_LINK_SECRET
  return secret && secret.length >= 32 ? secret : null
}

export function createReviewToken(deliverableId: string, now = Date.now()): string | null {
  const secret = getSecret()
  if (!secret) return null

  const expiresAt = Math.floor(now / 1000) + REVIEW_TOKEN_TTL_SECONDS
  const payload = `v1.${deliverableId}.${expiresAt}`
  const signature = createHmac("sha256", secret).update(payload).digest("base64url")

  return `${payload}.${signature}`
}

export function verifyReviewToken(
  deliverableId: string,
  token: string | undefined,
  now = Date.now()
): boolean {
  const secret = getSecret()
  if (!secret || !token) return false

  const parts = token.split(".")
  if (parts.length !== 4 || parts[0] !== "v1" || parts[1] !== deliverableId) {
    return false
  }

  const expiresAt = Number(parts[2])
  if (!Number.isInteger(expiresAt) || expiresAt <= Math.floor(now / 1000)) {
    return false
  }

  const expected = Buffer.from(
    createHmac("sha256", secret).update(`v1.${deliverableId}.${expiresAt}`).digest("base64url")
  )
  const provided = Buffer.from(parts[3])

  return expected.length === provided.length && timingSafeEqual(expected, provided)
}

export function buildReviewUrl(deliverableId: string): string | null {
  const token = createReviewToken(deliverableId)
  if (!token) return null

  const baseUrl = (env.server.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "")
  return `${baseUrl}/review/${deliverableId}?token=${encodeURIComponent(token)}`
}
