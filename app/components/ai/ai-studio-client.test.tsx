import React from "react"
import { screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
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
  postKeys: {
    list: (id?: string | null) => ["posts", "list", id],
    all: ["posts"],
  },
}))

describe("AiStudioClient", () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})
