import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { ReelsScriptDialog } from "./reels-script-dialog"
import { renderWithProviders } from "@/test/render-with-providers"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockGenerateMutateAsync = vi.fn()
vi.mock("@/features/reels-script/api/queries", () => ({
  useGenerateReelsScript: () => ({
    mutateAsync: mockGenerateMutateAsync,
    isPending: false,
  }),
}))

describe("ReelsScriptDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateMutateAsync.mockResolvedValue({
      success: true,
      data: {
        title: "Reel Blueprint: Cara Seduh Matcha",
        conceptOneIdea: "Satu ide: Cara seduh matcha tanpa gumpalan",
        goal: "reach",
        lengthTier: "15-30s",
        audioType: "original_voice",
        sendsQuestion: "Siapa yang akan mem-forward video ini ke siapa via DM dan kenapa?",
        coverFrameBrief: {
          gridSafeVisual: "Tangan memegang whisk bambu di atas mangkuk matcha",
          centerBoldText: "Rahasia Matcha Halus",
        },
        instagramSeo: {
          primaryKeyword: "seduh matcha",
          secondaryKeywords: ["cara seduh matcha", "tips matcha"],
          captionOpener: "Cara termudah seduh matcha tanpa gumpalan di rumah.",
        },
        audioNotes: "Gunakan suara asli narator dengan artikulasi jelas.",
        beats: [
          {
            timecode: "0:00 - 0:03",
            beatName: "3-Second Hook (Sound-Off First)",
            visualShot: "Close-up matcha hijau pekat dituangkan tanpa jeda.",
            veoPrompt: "Macro 4k 60fps vertical shot of green matcha whisking",
            onScreenText: "Jangan seduh matcha pakai air mendidih!",
            spokenAudio: "Kalau matcha kamu terasa pahit, jangan salahkan bubuknya.",
            audioCue: "Whoosh SFX",
          },
          {
            timecode: "0:03 - 0:08",
            beatName: "The Problem",
            visualShot: "Perlihatkan gumpalan matcha kasar di dasar cangkir.",
            onScreenText: "Air 100 derajat bikin rasa gosong & berbusa kasar",
            spokenAudio: "Air terlalu panas merusak aroma dan bikin ampas menggumpal.",
          },
        ],
      },
    })
  })

  it("renders dialog with title, micro parameters, and input", () => {
    renderWithProviders(
      <ReelsScriptDialog
        open={true}
        onOpenChange={vi.fn()}
        clientId="c-1"
        clientName="Pawon Matcha"
      />
    )

    expect(
      screen.getByText(/Reels & Short-Form Video Scripting Studio/i)
    ).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/Contoh: 3 kesalahan menyeduh teh/i)
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Rancang Naskah/i })).toBeInTheDocument()
  })

  it("generates script and displays 3-column production table", async () => {
    renderWithProviders(
      <ReelsScriptDialog
        open={true}
        onOpenChange={vi.fn()}
        clientId="c-1"
        clientName="Pawon Matcha"
      />
    )

    const input = screen.getByPlaceholderText(/Contoh: 3 kesalahan menyeduh teh/i)
    fireEvent.change(input, { target: { value: "Cara Seduh Matcha" } })

    const btn = screen.getByRole("button", { name: /Rancang Naskah/i })
    fireEvent.click(btn)

    await waitFor(() => {
      expect(mockGenerateMutateAsync).toHaveBeenCalledWith({
        clientId: "c-1",
        clientName: "Pawon Matcha",
        topic: "Cara Seduh Matcha",
        goal: "reach",
        lengthTier: "15-30s",
        audioType: "original_voice",
      })
      expect(screen.getByText(/The Sends Question/i)).toBeInTheDocument()
      expect(screen.getByText(/Cover Frame Brief/i)).toBeInTheDocument()
      expect(screen.getByText(/Rahasia Matcha Halus/i)).toBeInTheDocument()
      expect(screen.getByText(/Tabel Naskah Produksi/i)).toBeInTheDocument()
      expect(
        screen.getByText(/Jangan seduh matcha pakai air mendidih/i)
      ).toBeInTheDocument()
    })
  })

  it("navigates to Composer when Buka di Composer is clicked", async () => {
    const onOpenChange = vi.fn()
    renderWithProviders(
      <ReelsScriptDialog
        open={true}
        onOpenChange={onOpenChange}
        clientId="c-1"
        clientName="Pawon Matcha"
      />
    )

    const input = screen.getByPlaceholderText(/Contoh: 3 kesalahan menyeduh teh/i)
    fireEvent.change(input, { target: { value: "Cara Seduh Matcha" } })
    fireEvent.click(screen.getByRole("button", { name: /Rancang Naskah/i }))

    await waitFor(() => {
      expect(screen.getByText(/Tabel Naskah Produksi/i)).toBeInTheDocument()
    })

    const composerBtn = screen.getByRole("button", { name: /Buka di Composer/i })
    fireEvent.click(composerBtn)

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/admin/composer?"))
  })
})
