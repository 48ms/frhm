import React from "react"
import { screen, fireEvent, cleanup } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { AiStudioClient } from "./ai-studio-client"
import { renderWithProviders } from "@/test/render-with-providers"

const mockPush = vi.fn()
const mockGenerateIdeas = vi.fn()
const mockGenerateBatch = vi.fn()
const mockEvaluateTrend = vi.fn()
const mockCreateScheduledPost = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock("@/components/dashboard-stitch/dashboard-data", () => ({
  useActiveDashboard: () => ({
    clientId: "client-taraju",
    client: {
      id: "client-taraju",
      name: "Taraju Tea",
      brand_profile: {
        who: "Kafe dan produsen teh artisan",
        audience: "Pecinta teh herbal 20-40 tahun",
        voice: "Hangat dan menenangkan",
        pov: "Ahli seduh",
        proof: "Kebun teh organik sejak 1920",
        guardrails: "Hindari klaim medis berlebihan",
        pillars: ["Edukasi Teh", "Resep Minuman", "Cerita Petani"],
      },
    },
    clients: [],
  }),
}))

vi.mock("@/features/copilot/api/queries", () => ({
  useGenerateContentIdeas: () => ({
    mutateAsync: mockGenerateIdeas,
    isPending: false,
  }),
  useGenerateBatchPlan: () => ({
    mutateAsync: mockGenerateBatch,
    isPending: false,
  }),
  useEvaluateTrend: () => ({
    mutateAsync: mockEvaluateTrend,
    isPending: false,
  }),
}))

vi.mock("@/features/scheduled-posts/api/queries", () => ({
  useCreateScheduledPost: () => ({
    mutateAsync: mockCreateScheduledPost,
    isPending: false,
  }),
  useCreateScheduledPostsBatch: () => ({
    mutateAsync: mockCreateScheduledPost,
    isPending: false,
  }),
  postKeys: {
    list: (id?: string | null) => ["posts", "list", id],
    all: ["posts"],
  },
}))

vi.mock("@/features/skills/api/queries", () => ({
  useSkillChatTurn: () => ({ mutate: vi.fn(), isPending: false }),
  useSaveSkillOutput: () => ({ mutate: vi.fn(), isPending: false }),
  useExecuteSkillTool: () => ({ mutate: vi.fn(), isPending: false }),
  useExecuteGenericSkill: () => ({ mutate: vi.fn(), isPending: false }),
  useSkillDetail: () => ({ data: null, isLoading: false }),
  useSkills: () => ({ data: [], isLoading: false }),
  useSkillPacks: () => ({ data: [], isLoading: false }),
  skillKeys: {
    all: ["skills"],
    list: vi.fn(),
    packs: vi.fn(),
    detail: vi.fn(),
    clientSkills: vi.fn(),
    outputs: vi.fn(),
  },
}))

vi.mock("@/features/voice-builder/api/queries", () => ({
  useExtractVoice: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSaveVoiceGuide: () => ({ mutateAsync: vi.fn(), isPending: false }),
  voiceBuilderKeys: {
    all: ["voice-builder"],
    detail: vi.fn(),
  },
}))

describe("AiStudioClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    cleanup()
    window.history.replaceState({}, '', '/')
    document.body.innerHTML = ""
    document.body.removeAttribute("data-scroll-locked")
    document.body.removeAttribute("aria-hidden")
    document.body.style.pointerEvents = ""
  })

  it("renders page header, client badge, and all four tabs", () => {
    renderWithProviders(<AiStudioClient />)

    expect(screen.getByText(/AI Creative Studio & Strategy Hub/i)).toBeInTheDocument()
    expect(screen.getByText("Taraju Tea")).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Idea Engine/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Batch Planner/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Trend Radar/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Brand Brain/i })).toBeInTheDocument()
  })

  it("defaults to Idea Engine and renders the SPARK controls", () => {
    renderWithProviders(<AiStudioClient />)

    expect(screen.getByText(/SPARK Ideation Engine/i)).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/Contoh: Manfaat teh putih organik/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Racik Ide Konten Sekarang/i })
    ).toBeInTheDocument()
  })

  it("switches to Batch Planner tab and displays campaign planning controls", () => {
    renderWithProviders(<AiStudioClient />)

    const batchTab = screen.getByRole("tab", { name: /Batch Planner/i })
    fireEvent.click(batchTab)

    expect(screen.getByText(/30-Day Batch Campaign Planner/i)).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/Kampanye peluncuran menu teh musim panas/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Generate Batch Plan Sekarang/i })
    ).toBeInTheDocument()
  })

  it("switches to Trend Radar tab and displays 3-gate audit form", () => {
    renderWithProviders(<AiStudioClient />)

    const trendTab = screen.getByRole("tab", { name: /Trend Radar/i })
    fireEvent.click(trendTab)

    expect(screen.getByText(/Trend Radar & 3-Gate Vetting Engine/i)).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText(/Tren format video 'A Day in My Life/i)
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Audit Kelayakan Tren Sekarang/i })
    ).toBeInTheDocument()
  })

  it("switches to Brand Brain tab and displays active client profile DNA", () => {
    renderWithProviders(<AiStudioClient />)

    const brandBrainTab = screen.getByRole("tab", { name: /Brand Brain/i })
    fireEvent.click(brandBrainTab)

    expect(screen.getByText(/Brand Brain & Context Matrix/i)).toBeInTheDocument()
    expect(screen.getByText("Kafe dan produsen teh artisan")).toBeInTheDocument()
    expect(screen.getByText("Pecinta teh herbal 20-40 tahun")).toBeInTheDocument()
    expect(screen.getByText("Hangat dan menenangkan")).toBeInTheDocument()
    expect(screen.getByText("Hindari klaim medis berlebihan")).toBeInTheDocument()
    expect(screen.getByText("Edukasi Teh")).toBeInTheDocument()
    expect(screen.getByText("Resep Minuman")).toBeInTheDocument()
  })

  it("opens SkillInterviewModal when Wawancara AI Brand Profile is clicked in Brand Brain tab", () => {
    renderWithProviders(<AiStudioClient />)

    const brandBrainTab = screen.getByRole("tab", { name: /Brand Brain/i })
    fireEvent.click(brandBrainTab)

    const interviewBtn = screen.getByRole("button", { name: /Wawancara AI Brand Profile/i })
    expect(interviewBtn).toBeInTheDocument()
    fireEvent.click(interviewBtn)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("brand-profile")).toBeInTheDocument()

    const closeBtn = screen.getByRole("button", { name: /close/i })
    fireEvent.click(closeBtn)
  })

  it("opens VoiceBuilderDialog when Ekstrak Suara (Voice Builder) is clicked in Brand Brain tab", () => {
    renderWithProviders(<AiStudioClient />)

    const brandBrainTab = screen.getByRole("tab", { name: /Brand Brain/i })
    fireEvent.click(brandBrainTab)

    const voiceBuilderBtn = screen.getByRole("button", { name: /Ekstrak Suara \(Voice Builder\)/i })
    expect(voiceBuilderBtn).toBeInTheDocument()
    fireEvent.click(voiceBuilderBtn)

    expect(screen.getByText("Voice Builder Architecture")).toBeInTheDocument()
    expect(screen.getByText(/Target Karakter Suara:/i)).toBeInTheDocument()

    const closeBtn = screen.getByRole("button", { name: /Tutup/i })
    fireEvent.click(closeBtn)
  })

  it("opens ReelsScriptDialog when Reels Script is clicked in Idea Engine", () => {
    renderWithProviders(<AiStudioClient />)

    const ideasTab = screen.getByRole("tab", { name: /Idea Engine/i })
    fireEvent.click(ideasTab)

    const reelsBtn = screen.getByRole("button", { name: /Reels Script/i })
    expect(reelsBtn).toBeInTheDocument()
    fireEvent.click(reelsBtn)

    expect(
      screen.getByText(/Reels & Short-Form Video Scripting Studio/i)
    ).toBeInTheDocument()

    const closeBtn = screen.getByRole("button", { name: /Tutup/i })
    fireEvent.click(closeBtn)
  })

  it("opens CarouselDialog when Carousel Studio is clicked in Idea Engine", () => {
    renderWithProviders(<AiStudioClient />)

    const ideasTab = screen.getByRole("tab", { name: /Idea Engine/i })
    fireEvent.click(ideasTab)

    const carouselBtn = screen.getByRole("button", { name: /Carousel Studio/i })
    expect(carouselBtn).toBeInTheDocument()
    fireEvent.click(carouselBtn)

    expect(
      screen.getByText(/Carousel Slide-by-Slide Generator/i)
    ).toBeInTheDocument()

    const closeBtn = screen.getByRole("button", { name: /Tutup/i })
    fireEvent.click(closeBtn)
  })

  it("opens VisualPromptDialog when Visual Prompter is clicked in Idea Engine", () => {
    renderWithProviders(<AiStudioClient />)

    const ideasTab = screen.getByRole("tab", { name: /Idea Engine/i })
    fireEvent.click(ideasTab)

    const visualBtn = screen.getByRole("button", { name: /Visual Prompter/i })
    expect(visualBtn).toBeInTheDocument()
    fireEvent.click(visualBtn)

    expect(
      screen.getByText(/Studio Visual Prompter & Generator Media/i)
    ).toBeInTheDocument()

    const closeBtn = screen.getByRole("button", { name: /Tutup/i })
    fireEvent.click(closeBtn)
  })
})

