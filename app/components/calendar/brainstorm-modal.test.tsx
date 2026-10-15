import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrainstormModal } from "./brainstorm-modal"

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

const generateIdeasMock = vi.fn()
const evaluateTrendMock = vi.fn()
const createPostMock = vi.fn()

vi.mock("@/features/copilot/api/queries", () => ({
  useGenerateContentIdeas: () => ({
    mutateAsync: (...args: unknown[]) => generateIdeasMock(...args),
    isPending: false,
  }),
  useEvaluateTrend: () => ({
    mutateAsync: (...args: unknown[]) => evaluateTrendMock(...args),
    isPending: false,
  }),
}))

vi.mock("@/features/scheduled-posts/api/queries", () => ({
  useCreateScheduledPost: () => ({
    mutateAsync: (...args: unknown[]) => createPostMock(...args),
    isPending: false,
  }),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

beforeEach(() => {
  generateIdeasMock.mockReset()
  evaluateTrendMock.mockReset()
  createPostMock.mockReset()
})

describe("BrainstormModal", () => {
  it("renders tabs for both SPARK Ideation and Trend-Jacking Audit", () => {
    renderWithProviders(<BrainstormModal clientId="client-test" open={true} />)

    expect(screen.getByText("AI Content Studio")).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /SPARK Ideation/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Audit Tren/i })).toBeInTheDocument()
  })

  it("switches to Trend Evaluator tab and submits trend audit with 3-gate results", async () => {
    evaluateTrendMock.mockResolvedValueOnce({
      evaluation: {
        overallApproved: true,
        gateFit: {
          pass: true,
          reason: "Sangat selaras dengan pilar edukasi dan citra brand.",
        },
        gateSafety: {
          pass: true,
          reason: "Risiko kontroversi minimal, sentimen publik positif.",
        },
        gateTiming: {
          status: "rising",
          verdict: "Siklus tren sedang naik pesat.",
        },
        remixAngle: "Bahas tren ini dari kacamata praktisi digital marketing.",
        draftPremise: "Kenapa semua orang salah paham soal tren ini?",
        recommendedFormat: "Reels",
      },
    })

    renderWithProviders(<BrainstormModal clientId="client-test" open={true} />)

    // Switch to Trend tab
    const trendTab = screen.getByRole("tab", { name: /Audit Tren/i })
    fireEvent.click(trendTab)

    // Check trend inputs exist
    const input = screen.getByPlaceholderText(/Jelaskan tren, sound, format/i)
    fireEvent.change(input, { target: { value: "Tren Sound Work-Life Reality" } })

    const auditBtn = screen.getByRole("button", { name: /Audit Kelayakan Tren/i })
    fireEvent.click(auditBtn)

    await waitFor(() => {
      expect(evaluateTrendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: "client-test",
          trendDescription: "Tren Sound Work-Life Reality",
        })
      )
    })

    // Verify 3-Gate results appear on screen
    expect(await screen.findByText(/REKOMENDASI: AMAN & COCOK \(GO\)/i)).toBeInTheDocument()
    expect(screen.getByText(/Brand Fit/i)).toBeInTheDocument()
    expect(screen.getByText(/Safety & Controversy/i)).toBeInTheDocument()
    expect(screen.getByText(/Timing & Lifecycle/i)).toBeInTheDocument()
    expect(screen.getByText(/Bahas tren ini dari kacamata praktisi/i)).toBeInTheDocument()
    expect(screen.getByText(/Kenapa semua orang salah paham soal tren ini\?/i)).toBeInTheDocument()
  })

  it("adds evaluated trend post to calendar with draft status and trend tag", async () => {
    createPostMock.mockResolvedValueOnce({ success: true })
    evaluateTrendMock.mockResolvedValueOnce({
      evaluation: {
        overallApproved: true,
        gateFit: { pass: true, reason: "Fit" },
        gateSafety: { pass: true, reason: "Safe" },
        gateTiming: { status: "emerging", verdict: "Early stage" },
        remixAngle: "Sudut Edukasi Brand",
        draftPremise: "Draft Naskah Tren",
        recommendedFormat: "TikTok",
      },
    })

    renderWithProviders(<BrainstormModal clientId="client-test" open={true} />)

    // Switch and run audit
    fireEvent.click(screen.getByRole("tab", { name: /Audit Tren/i }))
    fireEvent.change(screen.getByPlaceholderText(/Jelaskan tren, sound, format/i), {
      target: { value: "Tren Viral X" },
    })
    fireEvent.click(screen.getByRole("button", { name: /Audit Kelayakan Tren/i }))

    const addToCalendarBtn = await screen.findByRole("button", { name: /Jadikan Jadwal di Kalender/i })
    fireEvent.click(addToCalendarBtn)

    await waitFor(() => {
      expect(createPostMock).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: "client-test",
          status: "draft",
          campaign_tag: "Trend-Jacking",
        })
      )
    })
  })

  it("selects a Tone of Voice preset and passes it to ideation generator", async () => {
    generateIdeasMock.mockResolvedValueOnce({
      ideas: [
        {
          title: "Mitos Digital",
          content: "Penjelasan mitos",
          pillar: "Edukasi",
          format: "Carousel",
          platform: "Instagram",
          hook: "90% brand pemula salah kaprah soal ini",
        },
      ],
    })

    renderWithProviders(<BrainstormModal clientId="client-test" open={true} />)

    // Select tone
    const toneBtn = screen.getByRole("button", { name: /👑 Otoritatif/i })
    fireEvent.click(toneBtn)

    // Click generate
    const generateBtn = screen.getByRole("button", { name: /Generate Ideas/i })
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(generateIdeasMock).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: "client-test",
          trendOrTopic: expect.stringContaining("Gaya otoritatif"),
        })
      )
    })
  })
})
