import { describe, it, expect, vi, beforeEach } from "vitest"
import { resolveClientId } from "./resolve-client-id"

const mockGetClientsWithChannels = vi.fn()
const mockRedirect = vi.fn()

vi.mock("@/features/social-accounts/api/service", () => ({
  getClientsWithChannels: () => mockGetClientsWithChannels(),
}))

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
}))

describe("resolveClientId (Multi-Tenant & Zero-State Guard)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redirects smoothly to /admin/clients?onboarding=true when database has no clients", async () => {
    mockGetClientsWithChannels.mockResolvedValue([])

    await expect(resolveClientId(null)).rejects.toThrow("NEXT_REDIRECT:/admin/clients?onboarding=true")
    expect(mockRedirect).toHaveBeenCalledWith("/admin/clients?onboarding=true")
  })

  it("redirects to /admin/clients?onboarding=true if clients service returns null", async () => {
    mockGetClientsWithChannels.mockResolvedValue(null)

    await expect(resolveClientId(undefined)).rejects.toThrow("NEXT_REDIRECT:/admin/clients?onboarding=true")
    expect(mockRedirect).toHaveBeenCalledWith("/admin/clients?onboarding=true")
  })

  it("returns the first client id when url parameter is empty and clients exist", async () => {
    mockGetClientsWithChannels.mockResolvedValue([
      { id: "c-first", name: "Taraju" },
      { id: "c-second", name: "Pawon Sengon" },
    ])

    const result = await resolveClientId("")
    expect(result).toBe("c-first")
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it("returns the requested clientId if it matches an active client in database", async () => {
    mockGetClientsWithChannels.mockResolvedValue([
      { id: "c-first", name: "Taraju" },
      { id: "c-second", name: "Pawon Sengon" },
    ])

    const result = await resolveClientId("c-second")
    expect(result).toBe("c-second")
  })

  it("gracefully falls back to first client id if requested clientId does not exist (instead of crashing or 404)", async () => {
    mockGetClientsWithChannels.mockResolvedValue([
      { id: "c-first", name: "Taraju" },
      { id: "c-second", name: "Pawon Sengon" },
    ])

    const result = await resolveClientId("c-deleted-or-nonexistent")
    expect(result).toBe("c-first")
  })
})
