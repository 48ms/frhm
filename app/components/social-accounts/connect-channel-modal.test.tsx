import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { ConnectChannelModal } from "./connect-channel-modal"

// Toast adalah efek samping; kita cek panggilannya, bukan tampilannya.
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn(), loading: vi.fn() },
}))

const fetchMock = vi.fn()
vi.stubGlobal("fetch", fetchMock)

function renderModal(overrides: Partial<React.ComponentProps<typeof ConnectChannelModal>> = {}) {
  return render(
    <ConnectChannelModal
      open={true}
      client={{ id: "client-test", name: "B2B Shell Representatives" }}
      existingPlatforms={[]}
      onClose={() => {}}
      {...overrides}
    />
  )
}

describe("ConnectChannelModal — OAuth flow", () => {
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ json: async () => ({ url: "https://oauth.example/authorize" }) })
  })

  it("menampilkan grid platform yang bisa dihubungkan", () => {
    renderModal()
    for (const p of ["Instagram", "TikTok", "YouTube", "LinkedIn", "Twitter", "Facebook"]) {
      expect(screen.getByRole("button", { name: new RegExp(p, "i") })).toBeTruthy()
    }
  })

  it("menandai platform yang sudah terhubung dengan badge 'Connected'", () => {
    renderModal({ existingPlatforms: ["TikTok"] })
    expect(screen.getByText(/Connected/i)).toBeTruthy()
  })

  it("meminta OAuth URL ke server saat platform diklik", async () => {
    renderModal()
    fireEvent.click(screen.getByRole("button", { name: /Instagram/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/social/oauth-url",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ clientId: "client-test", platform: "Instagram" }),
        })
      )
    })
  })

  it("tidak memanggil server saat tidak ada client aktif (fail-closed)", () => {
    renderModal({ client: undefined, clientId: "" })
    fireEvent.click(screen.getByRole("button", { name: /Instagram/i }))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("menampilkan toast error saat server tidak mengembalikan URL", async () => {
    const { toast } = await import("sonner")
    fetchMock.mockResolvedValue({ json: async () => ({ error: "provider down" }) })

    renderModal()
    fireEvent.click(screen.getByRole("button", { name: /Instagram/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })
})
