import { beforeEach, describe, expect, it, vi } from "vitest"
import { authorizeReviewAccess } from "./access"

const mockGetUser = vi.fn()
const mockProfileMaybeSingle = vi.fn()
const mockDeliverableMaybeSingle = vi.fn()
const mockVerifyReviewToken = vi.fn()

vi.mock("./token", () => ({
  verifyReviewToken: (...args: unknown[]) => mockVerifyReviewToken(...args),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: mockProfileMaybeSingle })),
      })),
    })),
  }),
}))

vi.mock("@/lib/supabase/service", () => ({
  createSupabaseServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: mockDeliverableMaybeSingle })),
      })),
    })),
  })),
}))

describe("authorizeReviewAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyReviewToken.mockReturnValue(false)
    mockGetUser.mockResolvedValue({ data: { user: null } })
    mockProfileMaybeSingle.mockResolvedValue({ data: null })
    mockDeliverableMaybeSingle.mockResolvedValue({ data: null })
  })

  it("allows a valid signed token without a session", async () => {
    mockVerifyReviewToken.mockReturnValue(true)

    await expect(authorizeReviewAccess("deliv-1", "valid-token")).resolves.toBe(true)
    expect(mockGetUser).not.toHaveBeenCalled()
  })

  it("rejects anonymous access without a token", async () => {
    await expect(authorizeReviewAccess("deliv-1")).resolves.toBe(false)
  })

  it("allows an admin session", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } })
    mockProfileMaybeSingle.mockResolvedValue({ data: { role: "admin", client_id: null } })

    await expect(authorizeReviewAccess("deliv-1")).resolves.toBe(true)
  })

  it("allows a client whose tenant owns the deliverable", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } })
    mockProfileMaybeSingle.mockResolvedValue({ data: { role: "client", client_id: "client-1" } })
    mockDeliverableMaybeSingle.mockResolvedValue({ data: { client_id: "client-1" } })

    await expect(authorizeReviewAccess("deliv-1")).resolves.toBe(true)
  })

  it("rejects a client from another tenant", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } })
    mockProfileMaybeSingle.mockResolvedValue({ data: { role: "client", client_id: "client-1" } })
    mockDeliverableMaybeSingle.mockResolvedValue({ data: { client_id: "client-2" } })

    await expect(authorizeReviewAccess("deliv-1")).resolves.toBe(false)
  })

  it("fails closed when the profile lookup errors", async () => {
    mockGetUser.mockRejectedValue(new Error("auth unavailable"))

    await expect(authorizeReviewAccess("deliv-1")).resolves.toBe(false)
  })
})
