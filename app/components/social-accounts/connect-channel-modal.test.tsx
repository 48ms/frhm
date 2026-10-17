import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConnectChannelModal } from "./connect-channel-modal"
import * as socialService from "@/features/social-accounts/api/service"

// Toast adalah efek samping; kita cek panggilannya, bukan tampilannya.
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn(), loading: vi.fn() },
}))

vi.mock("@/features/social-accounts/api/service", () => ({
  requestOAuthUrl: vi.fn(),
}))

function renderModal(overrides: Partial<React.ComponentProps<typeof ConnectChannelModal>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ConnectChannelModal
        open={true}
        client={{ id: "client-test", name: "B2B Shell Representatives" }}
        existingPlatforms={[]}
        onClose={() => {}}
        {...overrides}
      />
    </QueryClientProvider>
  )
}

describe("ConnectChannelModal — OAuth flow", () => {
  beforeEach(() => {
    vi.mocked(socialService.requestOAuthUrl).mockReset()
    vi.mocked(socialService.requestOAuthUrl).mockResolvedValue({ url: "https://oauth.example/authorize" })
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
      expect(socialService.requestOAuthUrl).toHaveBeenCalledWith({
        clientId: "client-test",
        platform: "Instagram",
      })
    })
  })

  it("tidak memanggil server saat tidak ada client aktif (fail-closed)", () => {
    renderModal({ client: undefined, clientId: "" })
    fireEvent.click(screen.getByRole("button", { name: /Instagram/i }))
    expect(socialService.requestOAuthUrl).not.toHaveBeenCalled()
  })

  it("menampilkan toast error saat server tidak mengembalikan URL", async () => {
    const { toast } = await import("sonner")
    vi.mocked(socialService.requestOAuthUrl).mockRejectedValue(new Error("provider down"))

    renderModal()
    fireEvent.click(screen.getByRole("button", { name: /Instagram/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("provider down")
    })
  })
})
