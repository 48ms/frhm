import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StitchAiHookModal } from "./ai-hook-modal"

const mockGenerateIdeas = vi.fn()
vi.mock("@/features/copilot/api/queries", () => ({
  useGenerateContentIdeas: () => ({
    mutateAsync: mockGenerateIdeas,
    isPending: false,
  }),
}))

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe("StitchAiHookModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateIdeas.mockResolvedValue({
      ideas: [
        { hook: "Inilah rahasia omzet naik 3x lipat tanpa iklan!" },
        { hook: "Stop posting konten kalau belum tahu strategi ini!" },
      ],
    })
  })

  it("does not render when open is false", () => {
    renderWithProviders(
      <StitchAiHookModal
        open={false}
        onOpenChange={vi.fn()}
        clientName="Pawon Sengon"
        clientId="client-123"
      />
    )
    expect(screen.queryByText(/Studio AI Hook Generator/i)).toBeNull()
  })

  it("renders modal header, client name, and input when open is true", () => {
    renderWithProviders(
      <StitchAiHookModal
        open={true}
        onOpenChange={vi.fn()}
        clientName="Pawon Sengon"
        clientId="client-123"
      />
    )
    expect(screen.getByText(/Studio AI Hook Generator/i)).toBeDefined()
    expect(screen.getByText(/Hook untuk Pawon Sengon/i)).toBeDefined()
    expect(screen.getByPlaceholderText(/Contoh: peluncuran produk/i)).toBeDefined()
  })

  it("calls generateIdeas on button click and displays hooks", async () => {
    renderWithProviders(
      <StitchAiHookModal
        open={true}
        onOpenChange={vi.fn()}
        clientName="Pawon Sengon"
        clientId="client-123"
      />
    )

    const input = screen.getByPlaceholderText(/Contoh: peluncuran produk/i)
    fireEvent.change(input, { target: { value: "kuliner sambal tradisional" } })

    const generateBtn = screen.getByRole("button", { name: /Generate/i })
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(mockGenerateIdeas).toHaveBeenCalledWith({
        clientId: "client-123",
        count: 3,
        trendOrTopic: "kuliner sambal tradisional",
      })
      expect(screen.getByText("Inilah rahasia omzet naik 3x lipat tanpa iklan!")).toBeDefined()
      expect(screen.getByText("Stop posting konten kalau belum tahu strategi ini!")).toBeDefined()
    })
  })

  it("routes selected hook to Composer when Composer button is clicked", async () => {
    const handleOpenChange = vi.fn()
    renderWithProviders(
      <StitchAiHookModal
        open={true}
        onOpenChange={handleOpenChange}
        clientName="Pawon Sengon"
        clientId="client-123"
      />
    )

    const input = screen.getByPlaceholderText(/Contoh: peluncuran produk/i)
    fireEvent.change(input, { target: { value: "menu ayam bakar" } })
    fireEvent.click(screen.getByRole("button", { name: /Generate/i }))

    await waitFor(() => {
      expect(screen.getByText("Inilah rahasia omzet naik 3x lipat tanpa iklan!")).toBeDefined()
    })

    const composerButtons = screen.getAllByRole("button", { name: /Composer/i })
    fireEvent.click(composerButtons[0])

    expect(handleOpenChange).toHaveBeenCalledWith(false)
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/admin/composer?"))
  })

  it("routes selected hook to Calendar when Kalender button is clicked", async () => {
    const handleOpenChange = vi.fn()
    renderWithProviders(
      <StitchAiHookModal
        open={true}
        onOpenChange={handleOpenChange}
        clientName="Pawon Sengon"
        clientId="client-123"
      />
    )

    const input = screen.getByPlaceholderText(/Contoh: peluncuran produk/i)
    fireEvent.change(input, { target: { value: "menu ayam bakar" } })
    fireEvent.click(screen.getByRole("button", { name: /Generate/i }))

    await waitFor(() => {
      expect(screen.getByText("Inilah rahasia omzet naik 3x lipat tanpa iklan!")).toBeDefined()
    })

    const calenderButtons = screen.getAllByRole("button", { name: /Kalender/i })
    fireEvent.click(calenderButtons[0])

    expect(handleOpenChange).toHaveBeenCalledWith(false)
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/admin/calendar?"))
  })
})
