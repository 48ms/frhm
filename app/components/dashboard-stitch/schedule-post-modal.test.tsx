import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SchedulePostModal } from "./schedule-post-modal"
import type { ClientWithChannels } from "@/features/social-accounts/api/types"

const mockCreatePost = vi.fn().mockResolvedValue({ id: "post-1" })
const mockGenerateCaption = vi.fn().mockResolvedValue({ caption: "AI Generated Caption" })
const mockGenerateHooks = vi.fn().mockResolvedValue({
  hooks: [
    { text: "Hook 1: Jangan lewatkan!", angle: "FOMO", explanation: "Memicu urgensi" },
    { text: "Hook 2: Rahasia sukses!", angle: "Value", explanation: "Memberi edukasi" },
  ],
})

vi.mock("@/features/scheduled-posts/api/queries", () => ({
  useCreateScheduledPost: () => ({
    mutateAsync: mockCreatePost,
    isPending: false,
  }),
}))

vi.mock("@/features/copilot/api/queries", () => ({
  useGenerateCaption: () => ({
    mutateAsync: mockGenerateCaption,
    isPending: false,
  }),
  useGenerateHooks: () => ({
    mutateAsync: mockGenerateHooks,
    isPending: false,
  }),
}))

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/components/library/asset-picker", () => ({
  AssetPicker: () => null,
}))

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

const mockClient: ClientWithChannels = {
  id: "client-test-123",
  name: "Pawon Sengon",
  contact_email: "bunda@pawonsengon.id",
  contact_phone: "081234567890",
  brand_profile: {
    who: "Pawon Sengon",
    audience: "Pecinta kuliner",
    voice: "Hangat dan bersahabat",
    pov: "Sajian khas nusantara",
    proof: "Sejak 2010",
    guardrails: "Kualitas terbaik",
    pillars: ["Kuliner", "Budaya"],
  },
  created_at: "2026-10-01",
  updated_at: "2026-10-01",
  channels: [
    { id: "ch-1", client_id: "client-test-123", platform: "instagram", handle: "@pawonsengon", status: "terhubung", note: null, avatar_url: null, confirmed_at: null, created_at: "", updated_at: "" },
    { id: "ch-2", client_id: "client-test-123", platform: "tiktok", handle: "@pawonsengon_tt", status: "terhubung", note: null, avatar_url: null, confirmed_at: null, created_at: "", updated_at: "" },
  ],
}

describe("SchedulePostModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("does not render when open is false", () => {
    renderWithProviders(<SchedulePostModal open={false} client={mockClient} onClose={vi.fn()} />)
    expect(screen.queryByText(/Jadwalkan Postingan/i)).toBeNull()
  })

  it("renders modal header, client name, and inputs when open is true", () => {
    renderWithProviders(<SchedulePostModal open={true} client={mockClient} onClose={vi.fn()} />)
    expect(screen.getByText(/Jadwalkan Postingan/i)).toBeDefined()
    expect(screen.getByText(/Pawon Sengon/i)).toBeDefined()
    expect(screen.getByLabelText(/Judul Postingan \/ Konsep/i)).toBeDefined()
    expect(screen.getByLabelText(/Caption/i)).toBeDefined()
  })

  it("switches to Live Preview tab and shows feed simulation", async () => {
    renderWithProviders(<SchedulePostModal open={true} client={mockClient} onClose={vi.fn()} />)

    const titleInput = screen.getByLabelText(/Judul Postingan \/ Konsep/i)
    fireEvent.change(titleInput, { target: { value: "Promo Nasi Goreng Spesial" } })

    const previewTab = screen.getByRole("tab", { name: /Live Preview/i })
    fireEvent.keyDown(previewTab, { key: "Enter" })
    fireEvent.click(previewTab)

    expect(screen.getByText(/Simulasi Feed Publikasi/i)).toBeDefined()
    expect(screen.getByText("Promo Nasi Goreng Spesial")).toBeDefined()
  })

  it("updates date and time using quick presets", async () => {
    renderWithProviders(<SchedulePostModal open={true} client={mockClient} onClose={vi.fn()} />)

    const tomorrowBtn = screen.getByRole("button", { name: "Besok" })
    fireEvent.click(tomorrowBtn)

    const dateInput = screen.getByLabelText(/Tanggal Rilis/i) as HTMLInputElement
    expect(dateInput.value).not.toBe("")

    const slotBtn = screen.getByRole("button", { name: /12:30/i })
    fireEvent.click(slotBtn)

    const timeInput = screen.getByLabelText(/Jam Tayang/i) as HTMLInputElement
    expect(timeInput.value).toBe("12:30")
  })

  it("inserts quick CTA chip into caption", async () => {
    renderWithProviders(<SchedulePostModal open={true} client={mockClient} onClose={vi.fn()} />)

    const ctaBtn = screen.getByRole("button", { name: /📲 Link Bio/i })
    fireEvent.click(ctaBtn)

    const captionInput = screen.getByLabelText(/Caption/i) as HTMLTextAreaElement
    expect(captionInput.value).toContain("Klik link di bio")
  })

  it("submits scheduled post successfully and calls createPost for selected channels", async () => {
    const handleClose = vi.fn()
    const handleScheduled = vi.fn()

    renderWithProviders(
      <SchedulePostModal
        open={true}
        client={mockClient}
        onClose={handleClose}
        onScheduled={handleScheduled}
      />
    )

    const titleInput = screen.getByLabelText(/Judul Postingan \/ Konsep/i)
    fireEvent.change(titleInput, { target: { value: "Menu Baru Masakan Jawa" } })

    const captionInput = screen.getByLabelText(/Caption/i)
    fireEvent.change(captionInput, { target: { value: "Rasakan kelezatan otentik khas dapur kami." } })

    const submitBtn = screen.getByRole("button", { name: /Jadwalkan Post/i })
    expect(submitBtn).not.toBeDisabled()

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalled()
      expect(handleScheduled).toHaveBeenCalledWith("Menu Baru Masakan Jawa")
      expect(handleClose).toHaveBeenCalled()
    })
  })

  it("switches to CHECK Pre-Flight tab and displays CHECK validation audit and zero-surprise recap", () => {
    renderWithProviders(<SchedulePostModal open={true} client={mockClient} onClose={vi.fn()} />)

    const titleInput = screen.getByLabelText(/Judul Postingan \/ Konsep/i)
    fireEvent.change(titleInput, { target: { value: "Peluncuran Menu Ayam Bakar" } })

    const checkTab = screen.getByRole("tab", { name: /CHECK Pre-Flight/i })
    fireEvent.keyDown(checkTab, { key: "Enter" })
    fireEvent.click(checkTab)

    expect(screen.getByText(/CHECK Framework Pre-Flight Audit/i)).toBeDefined()
    expect(screen.getByText(/Collect Targets/i)).toBeDefined()
    expect(screen.getByText(/Hydrate Required Fields/i)).toBeDefined()
    expect(screen.getByText(/Enforce Media & Limit Rules/i)).toBeDefined()
    expect(screen.getByText(/Confirm Truthful Declarations/i)).toBeDefined()
    expect(screen.getByText(/Knock Through/i)).toBeDefined()
    expect(screen.getByText(/Zero-Surprise: Draft Kalender/i)).toBeDefined()
  })
})
