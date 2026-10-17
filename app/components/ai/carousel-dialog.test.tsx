import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { CarouselDialog } from "./carousel-dialog"
import { renderWithProviders } from "@/test/render-with-providers"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockGenerateMutateAsync = vi.fn()
vi.mock("@/features/carousel/api/queries", () => ({
  useGenerateCarousel: () => ({
    mutateAsync: mockGenerateMutateAsync,
    isPending: false,
  }),
}))

describe("CarouselDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateMutateAsync.mockResolvedValue({
      success: true,
      data: {
        title: "Carousel: Panduan Roast Kopi",
        oneIdeaSpine: "Satu ide inti: Panduan roast kopi sederhana",
        structure: "how_to",
        platform: "instagram",
        slideCount: 6,
        coverPromise: "Panduan Praktis Roast Kopi",
        singleActionCta: "Simpan postingan ini (Bookmark)",
        suggestedCaption: "Simak rangkuman lengkap di carousel ini.",
        slides: [
          {
            slideNumber: 1,
            slideRole: "cover",
            headline: "Panduan Praktis Roast Kopi",
            subhead: "Geser ke samping untuk 4 langkah esensial →",
            visualLayoutDirection: "Desain minimalis, teks tebal di tengah",
            ideogramPrompt: "Minimalist graphic cover with bold text",
          },
          {
            slideNumber: 2,
            slideRole: "content",
            headline: "01. Pilih Biji Green Bean Segar",
            subhead: "Kadar air 10-12% adalah sweet spot",
            takeawayBullet: "Kunci: Beli dari roastery lokal terpercaya",
            visualLayoutDirection: "Ikon biji kopi minimalis",
          },
          {
            slideNumber: 6,
            slideRole: "cta",
            headline: "Simpan Postingan Ini untuk Nanti",
            subhead: "Ketuk ikon bookmark agar tidak hilang.",
            visualLayoutDirection: "Ikon bookmark besar di tengah",
          },
        ],
      },
    })
  })

  it("renders modal header, inputs, and button when open", () => {
    renderWithProviders(
      <CarouselDialog
        open={true}
        onOpenChange={vi.fn()}
        clientId="c-1"
        clientName="Pawon Sengon"
      />
    )

    expect(screen.getByText(/Carousel Slide-by-Slide Generator/i)).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/Contoh: 4 langkah memilih biji kopi/i)
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Rancang Carousel/i })).toBeInTheDocument()
  })

  it("generates storyboard and displays slide preview", async () => {
    renderWithProviders(
      <CarouselDialog
        open={true}
        onOpenChange={vi.fn()}
        clientId="c-1"
        clientName="Pawon Sengon"
      />
    )

    const input = screen.getByPlaceholderText(/Contoh: 4 langkah memilih biji kopi/i)
    fireEvent.change(input, { target: { value: "Panduan Roast Kopi" } })

    const btn = screen.getByRole("button", { name: /Rancang Carousel/i })
    fireEvent.click(btn)

    await waitFor(() => {
      expect(mockGenerateMutateAsync).toHaveBeenCalledWith({
        clientId: "c-1",
        clientName: "Pawon Sengon",
        topic: "Panduan Roast Kopi",
        painPointOrTakeaway: undefined,
        structure: "how_to",
        platform: "instagram",
      })
      expect(screen.getByText(/Single-Action CTA/i)).toBeInTheDocument()
      expect(screen.getAllByText(/Panduan Praktis Roast Kopi/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/Geser ke samping untuk 4 langkah esensial/i)).toBeInTheDocument()
    })
  })

  it("navigates to Composer when Buka di Composer button is clicked", async () => {
    const onOpenChange = vi.fn()
    renderWithProviders(
      <CarouselDialog
        open={true}
        onOpenChange={onOpenChange}
        clientId="c-1"
        clientName="Pawon Sengon"
      />
    )

    const input = screen.getByPlaceholderText(/Contoh: 4 langkah memilih biji kopi/i)
    fireEvent.change(input, { target: { value: "Panduan Roast Kopi" } })
    fireEvent.click(screen.getByRole("button", { name: /Rancang Carousel/i }))

    await waitFor(() => {
      expect(screen.getByText(/Single-Action CTA/i)).toBeInTheDocument()
    })

    const composerBtn = screen.getByRole("button", { name: /Buka di Composer/i })
    fireEvent.click(composerBtn)

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/admin/composer?"))
  })
})
