import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WeeklyRecommendations } from "./weekly-recommendations"

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockRunAudit = vi.fn()
vi.mock("@/features/analytics/api/queries", () => ({
  analyticsQueries: {
    listMetricsByClient: (clientId: string) => ({
      queryKey: ["analytics", "metrics", clientId],
      queryFn: () => [
        {
          id: "m-1",
          post_id: "post-1",
          reach: 4000,
          likes: 200,
          comments: 20,
          shares: 50,
          saves: 80,
          clicks: 30,
        },
        {
          id: "m-2",
          post_id: "post-2",
          reach: 800,
          likes: 15,
          comments: 1,
          shares: 2,
          saves: 1,
          clicks: 2,
        },
      ],
      initialData: [
        {
          id: "m-1",
          post_id: "post-1",
          reach: 4000,
          likes: 200,
          comments: 20,
          shares: 50,
          saves: 80,
          clicks: 30,
        },
        {
          id: "m-2",
          post_id: "post-2",
          reach: 800,
          likes: 15,
          comments: 1,
          shares: 2,
          saves: 1,
          clicks: 2,
        },
      ],
    }),
  },
  useAuditPerformanceAndIterate: () => ({
    mutateAsync: mockRunAudit,
    isPending: false,
  }),
}))

vi.mock("@/features/scheduled-posts/api/queries", () => ({
  scheduledPostQueries: {
    listByClient: (clientId: string) => ({
      queryKey: ["scheduled-posts", clientId],
      queryFn: () => [
        { id: "post-1", title: "Resep Spesial Pawon", platform: "instagram" },
        { id: "post-2", title: "Diskon Akhir Pekan", platform: "tiktok" },
      ],
      initialData: [
        { id: "post-1", title: "Resep Spesial Pawon", platform: "instagram" },
        { id: "post-2", title: "Diskon Akhir Pekan", platform: "tiktok" },
      ],
    }),
  },
}))

function renderComponent(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <WeeklyRecommendations clientId="client-test" clientName="Pawon Sengon" {...props} />
    </QueryClientProvider>
  )
}

describe("WeeklyRecommendations Widget (METER Closed-Loop)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders 3 tactical recommendations derived from factual post metrics", async () => {
    renderComponent()

    expect(screen.getByText("3 Rekomendasi Mingguan")).toBeInTheDocument()
    expect(screen.getByText("METER Closed-Loop")).toBeInTheDocument()

    // Cek ada 3 nomor urut rekomendasi
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()

    // Rekomendasi 1 merefleksikan recycle post pemenang
    expect(screen.getByText(/Recycle pemenang 'Resep Spesial Pawon'/)).toBeInTheDocument()

    // Rekomendasi 2 merefleksikan optimasi hook post evaluasi
    expect(screen.getByText(/Optimasi Hook 3-Detik/)).toBeInTheDocument()
  })

  it("navigates to Composer with prefilled title and content on 1-click button click", async () => {
    renderComponent()

    const composerButtons = screen.getAllByRole("button", { name: /Composer/i })
    expect(composerButtons.length).toBeGreaterThan(0)

    fireEvent.click(composerButtons[0])

    expect(mockPush).toHaveBeenCalledTimes(1)
    const calledUrl = mockPush.mock.calls[0][0]
    expect(calledUrl).toContain("/admin/composer")
    expect(calledUrl).toContain("clientId=client-test")
    expect(calledUrl).toContain("title=")
    expect(calledUrl).toContain("content=")
  })

  it("renders AI audit report with Top Winner and Underperformer when provided", () => {
    const mockReport = {
      overallHealth: "STABLE" as const,
      signalScore: 82,
      summary: "Evaluasi performa konten menunjukkan interaksi tinggi pada kategori edukasi.",
      signalAnalysis: {
        reachSignal: "Stabil",
        engagementSignal: "Saves tinggi",
        conversionSignal: "Konversi bagus",
      },
      winners: [
        {
          title: "Resep Spesial Pawon",
          reason: "Tingginya saves & shares dari target market keluarga.",
        },
      ],
      underperformers: [
        {
          title: "Diskon Akhir Pekan",
          rootCause: "Hard-selling langsung tanpa hook penasaran.",
          fixAngle: "Ubah menjadi storytelling problem-solution.",
        },
      ],
      actionableIterations: [
        {
          action: "Buat Reel 30s kelanjutan Resep Spesial",
          targetPlatform: "instagram",
          priority: "HIGH" as const,
          recommendedPrompt: "3 Kesalahan saat memasak menu ini...",
        },
        {
          action: "Ubah angle Diskon Akhir Pekan",
          targetPlatform: "tiktok",
          priority: "MEDIUM" as const,
          recommendedPrompt: "Kenapa menu ini selalu sold out dalam 2 jam?",
        },
        {
          action: "Kirim pesan broadcast diskon ke leads WA",
          targetPlatform: "instagram",
          priority: "LOW" as const,
          recommendedPrompt: "Follow-up leads DM yang belum checkout minggu ini.",
        },
      ],
    }

    renderComponent({ initialReport: mockReport })

    expect(screen.getByText(/Status: STABLE • Signal Score: 82\/100/)).toBeInTheDocument()
    expect(screen.getByText("Top Winner")).toBeInTheDocument()
    expect(screen.getByText("Resep Spesial Pawon")).toBeInTheDocument()
    expect(screen.getByText("Underperformer")).toBeInTheDocument()
    expect(screen.getByText("Diskon Akhir Pekan")).toBeInTheDocument()
    expect(screen.getByText(/Buat Reel 30s kelanjutan Resep Spesial/)).toBeInTheDocument()
  })
})
