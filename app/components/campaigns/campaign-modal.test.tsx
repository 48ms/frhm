import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CampaignModal } from "./campaign-modal"

const generateIdeasMock = vi.fn()
const onSaveMock = vi.fn()
const onCloseMock = vi.fn()

vi.mock("@/components/dashboard-stitch/dashboard-data", () => ({
  useActiveDashboard: () => ({
    clientId: "client-1",
    clients: [
      { id: "client-1", name: "Taraju" },
      { id: "client-2", name: "Pawon Sengon" },
    ],
  }),
}))

vi.mock("@/features/copilot/api/queries", () => ({
  useGenerateContentIdeas: () => ({
    mutateAsync: (...args: unknown[]) => generateIdeasMock(...args),
    isPending: false,
  }),
}))

vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn(),
    dismiss: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function renderModal(open = true) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <CampaignModal open={open} onClose={onCloseMock} onSave={onSaveMock} />
    </QueryClientProvider>
  )
}

describe("CampaignModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders Create Campaign modal with starter presets on Step 1", () => {
    renderModal(true)
    expect(screen.getByText("Create Campaign")).toBeInTheDocument()
    expect(screen.getByText("⚡ Payday Promo")).toBeInTheDocument()
    expect(screen.getByText("🚀 Product Launch")).toBeInTheDocument()
  })

  it("applies starter preset template when preset chip is clicked", () => {
    renderModal(true)
    const presetBtn = screen.getByText("⚡ Payday Promo")
    fireEvent.click(presetBtn)

    const nameInput = screen.getByLabelText("Campaign Name") as HTMLInputElement
    expect(nameInput.value).toBe("Payday Promo")
  })

  it("navigates to Step 2 and inserts objective chip into notes", () => {
    renderModal(true)
    const nameInput = screen.getByLabelText("Campaign Name")
    fireEvent.change(nameInput, { target: { value: "Q4 Growth Campaign" } })

    const continueBtn = screen.getByText("Continue")
    fireEvent.click(continueBtn)

    expect(screen.getByText("Notes / Objectives")).toBeInTheDocument()
    expect(screen.getByText("✨ AI Campaign Angles")).toBeInTheDocument()

    const objectiveChip = screen.getByText("🎯 Reach & Awareness")
    fireEvent.click(objectiveChip)

    const notesTextarea = screen.getByLabelText("Notes / Objectives") as HTMLTextAreaElement
    expect(notesTextarea.value).toContain("Tingkatkan reach dan brand awareness")
  })

  it("generates AI campaign angles and inserts chosen suggestion into notes", async () => {
    generateIdeasMock.mockResolvedValueOnce({
      ideas: [
        {
          title: "Sudut Edukasi Nilai",
          content: "Fokus pada efisiensi biaya dan ROI klien.",
          pillar: "Education",
          format: "Carousel",
          platform: "Instagram",
          hook: "Tahukah Anda?",
        },
      ],
    })

    renderModal(true)
    const nameInput = screen.getByLabelText("Campaign Name")
    fireEvent.change(nameInput, { target: { value: "Solusi B2B" } })

    fireEvent.click(screen.getByText("Continue"))

    const aiButton = screen.getByText("✨ AI Campaign Angles")
    fireEvent.click(aiButton)

    await waitFor(() => {
      expect(screen.getByText(/Sudut Edukasi Nilai: Fokus pada efisiensi/)).toBeInTheDocument()
    })

    const suggestionBtn = screen.getByText(/Sudut Edukasi Nilai: Fokus pada efisiensi/)
    fireEvent.click(suggestionBtn)

    const notesTextarea = screen.getByLabelText("Notes / Objectives") as HTMLTextAreaElement
    expect(notesTextarea.value).toContain("Sudut Edukasi Nilai")
  })
})
