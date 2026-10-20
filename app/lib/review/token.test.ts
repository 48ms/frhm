import { afterEach, describe, expect, it, vi } from "vitest"
import {
  REVIEW_TOKEN_TTL_SECONDS,
  buildReviewUrl,
  createReviewToken,
  verifyReviewToken,
} from "./token"

const DELIVERABLE_ID = "11111111-1111-1111-1111-111111111111"

describe("review token", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("creates a token that verifies for the same deliverable", () => {
    const token = createReviewToken(DELIVERABLE_ID)

    expect(token).toBeTruthy()
    expect(token).toContain(`v1.${DELIVERABLE_ID}.`)
    expect(verifyReviewToken(DELIVERABLE_ID, token ?? undefined)).toBe(true)
  })

  it("rejects a token for another deliverable", () => {
    const token = createReviewToken(DELIVERABLE_ID)

    expect(verifyReviewToken("22222222-2222-2222-2222-222222222222", token ?? undefined)).toBe(false)
  })

  it("rejects expired tokens", () => {
    const now = Date.now()
    const token = createReviewToken(DELIVERABLE_ID, now)

    expect(
      verifyReviewToken(DELIVERABLE_ID, token ?? undefined, now + (REVIEW_TOKEN_TTL_SECONDS + 1) * 1000)
    ).toBe(false)
  })

  it("rejects tampered signatures", () => {
    const token = createReviewToken(DELIVERABLE_ID) ?? ""
    const last = token.at(-1) === "A" ? "B" : "A"
    const tampered = `${token.slice(0, -1)}${last}`

    expect(verifyReviewToken(DELIVERABLE_ID, tampered)).toBe(false)
  })

  it("fails closed when the secret is missing or too short", () => {
    vi.stubEnv("REVIEW_LINK_SECRET", "")
    expect(createReviewToken(DELIVERABLE_ID)).toBeNull()

    vi.stubEnv("REVIEW_LINK_SECRET", "short")
    expect(createReviewToken(DELIVERABLE_ID)).toBeNull()
    expect(verifyReviewToken(DELIVERABLE_ID, "v1.whatever.9999999999.signature")).toBe(false)
  })

  it("builds an absolute review URL with the token", () => {
    const url = buildReviewUrl(DELIVERABLE_ID)

    expect(url).toContain(`/review/${DELIVERABLE_ID}?token=`)
    expect(url).toMatch(/^http:\/\/localhost:3000/)
  })
})
