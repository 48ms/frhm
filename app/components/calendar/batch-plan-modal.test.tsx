import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BatchPlanModal } from "./batch-plan-modal"

const mockGenerateBatchPlanMutate = vi.fn()
const mockCreateScheduledPostMutate = vi.fn()
const mockCreateDeliverable = vi.fn()

vi.mock("@/components/dashboard-stitch/dashboard-data", () => ({
  useActiveDashboard: () => ({
    client: { id: "client-1", name: "Pawon Sengon" },
  }),
}))

vi.mock("@/features/copilot/api/queries", () => ({
  useGenerateBatchPlan: () => ({
    mutateAsync: mockGenerateBatchPlanMutate,
    isPending: false,
  }),
}))

vi.mock("@/features/scheduled-posts/api/queries", () => ({
  useCreateScheduledPost: () => ({
    mutateAsync: mockCreateScheduledPostMutate,
  }),
  postKeys: {
    all: ["scheduled-posts"],
    list: (clientId: string) => ["scheduled-posts", "list", clientId],
  },
}))

vi.mock("@/features/deliverables/api/service", () => ({
  createDeliverable: (...args: any[]) => mockCreateDeliverable(...args),
}))

vi.mock("@/features/deliverables/api/queries", () => ({
  deliverableQueries: {
    listByClient: (clientId: string) => ({ queryKey: ["deliverables", clientId] }),
  },
}))

vi.mock("@/components/animate-ui/components/texts/metric-ticker", () => ({
  MetricTicker: ({ value }: { value: any }) => <span>{value}</span>,
}))

vi.mock("@/components/animate-ui/components/texts/shimmering-text", () => ({
  ShimmeringText: ({ text }: { text: string }) => <span>{text}</span>,
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(() => "toast-id"),
    dismiss: vi.fn(),
    promise: vi.fn((p) => p),
  },
}))

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe("BatchPlanModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders trigger button and opens config modal", () => {
    renderWithClient(<BatchPlanModal />)
    const trigger = screen.getByRole("button", { name: /Batch Plan/i })
    expect(trigger).toBeDefined()
    fireEvent.click(trigger)
    expect(screen.getByText("AI Batch Planner")).toBeDefined()
    expect(screen.getByText("Goal & Tema Khusus")).toBeDefined()
  })

  it("handles generation with Post Brief output and shows Intent mix bar", async () => {
    mockGenerateBatchPlanMutate.mockResolvedValueOnce({
      plan: {
        posts: [
          {
            title: "Post Edukasi Kopi",
            platform: "instagram",
            scheduled_at: "2026-10-25T10:00:00Z",
            content: "Cara seduh kopi tubruk yang manis alami tanpa gula.",
            pillar: "Edukasi & Resep",
            intent: "educate",
            format: "Carousel",
            hook: "Jangan aduk kopi tubruk sebelum tahu rumus 4 menit ini.",
            visualBrief: "Foto close up serbuk kopi",
            cta: "Simpan postingan ini",
          },
          {
            title: "Promo Diskon Akhir Pekan",
            platform: "tiktok",
            scheduled_at: "2026-10-26T14:00:00Z",
            content: "Diskon 20% khusus pelanggan setia.",
            pillar: "Penawaran Khusus",
            intent: "promote",
            format: "Reel",
            hook: "Khusus yang nonton video ini sampai akhir.",
            visualBrief: "Video suasana kedai ramai",
            cta: "Klik link di bio",
          },
        ],
      },
    })

    renderWithClient(<BatchPlanModal open={true} />)

    const textarea = screen.getByPlaceholderText(/Fokus awareness peluncuran produk/i)
    fireEvent.change(textarea, { target: { value: "Fokus edukasi resep dan promo akhir pekan" } })

    const generateBtn = screen.getByRole("button", { name: /Generate Kalender/i })
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(screen.getByText(/Review Post Brief/i)).toBeDefined()
      expect(screen.getByText("Post Edukasi Kopi")).toBeDefined()
      expect(screen.getByText(/Jangan aduk kopi tubruk/i)).toBeDefined()
      expect(screen.getByText(/Visual: Foto close up serbuk kopi/i)).toBeDefined()
      expect(screen.getByText(/CTA: Simpan postingan ini/i)).toBeDefined()
    })

    // Verify Intent mix bar renders
    expect(screen.getByText(/Komposisi Intent/i)).toBeDefined()
  })

  it("saves selected posts into calendar draft", async () => {
    mockGenerateBatchPlanMutate.mockResolvedValueOnce({
      plan: {
        posts: [
          {
            title: "Post Edukasi Kopi",
            platform: "instagram",
            scheduled_at: "2026-10-25T10:00:00Z",
            content: "Cara seduh kopi tubruk.",
            intent: "educate",
          },
        ],
      },
    })
    mockCreateScheduledPostMutate.mockResolvedValueOnce({ id: "post-1" })

    renderWithClient(<BatchPlanModal open={true} />)

    const textarea = screen.getByPlaceholderText(/Fokus awareness peluncuran produk/i)
    fireEvent.change(textarea, { target: { value: "Fokus edukasi resep seduhan kopi" } })
    fireEvent.click(screen.getByRole("button", { name: /Generate Kalender/i }))

    await waitFor(() => {
      expect(screen.getByText("Post Edukasi Kopi")).toBeDefined()
    })

    const saveBtn = screen.getByRole("button", { name: /Simpan 1 Post/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockCreateScheduledPostMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: "client-1",
          title: "Post Edukasi Kopi",
          content: "Cara seduh kopi tubruk.",
          platform: "instagram",
          status: "draft",
        })
      )
    })
  })
})
