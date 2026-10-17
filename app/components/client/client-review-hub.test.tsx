import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NuqsTestingAdapter } from "nuqs/adapters/testing"
import { ClientReviewHub } from "./client-review-hub"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/client/review",
}))

const mockDeliverableMutate = vi.fn()
const mockScheduledPostMutate = vi.fn()
const mockScheduledPostMutateAsync = vi.fn().mockResolvedValue({})

vi.mock("@/features/deliverables/api/queries", () => ({
  deliverableQueries: {
    listByClient: vi.fn(() => ({
      queryKey: ["deliverables", "list", "c-test-1"],
      queryFn: () => [
        {
          id: "deliv-1",
          client_id: "c-test-1",
          type: "content",
          title: "Poster Diskon Hari Kopi Nasional",
          content_md: "Materi promosi hari kopi.",
          external_link: null,
          status: "sent",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    })),
  },
  useUpdateDeliverableStatus: () => ({
    mutate: mockDeliverableMutate,
    isPending: false,
  }),
}))

vi.mock("@/features/scheduled-posts/api/queries", () => ({
  useScheduledPosts: () => ({
    data: [
      {
        id: "post-1",
        client_id: "c-test-1",
        title: "Panduan Seduh V60 Taraju",
        content: "Save postingan ini untuk eksperimen kopi manual brew terbaik.",
        platform: "instagram",
        scheduled_at: new Date().toISOString(),
        status: "draft",
        campaign_tag: "saveable",
      },
      {
        id: "post-2",
        client_id: "c-test-1",
        title: "Kisah Sang Petani Kopi",
        content: "Relate banget sama perjuangan memetik ceri kopi merah merona.",
        platform: "tiktok",
        scheduled_at: new Date().toISOString(),
        status: "draft",
        campaign_tag: "shareable",
      },
    ],
    isLoading: false,
  }),
  useUpdateScheduledPost: () => ({
    mutate: mockScheduledPostMutate,
    mutateAsync: mockScheduledPostMutateAsync,
    isPending: false,
  }),
}))

describe("ClientReviewHub", () => {
  function renderWithProviders(ui: React.ReactElement) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return render(
      <NuqsTestingAdapter>
        <QueryClientProvider client={queryClient}>
          {ui}
        </QueryClientProvider>
      </NuqsTestingAdapter>
    )
  }

  it("renders deliverables list and SLA & review policy guidance section", async () => {
    renderWithProviders(<ClientReviewHub clientId="c-test-1" />)

    expect(screen.getByText("Deliverables & Review Hub")).toBeInTheDocument()
    expect(await screen.findByText("Poster Diskon Hari Kopi Nasional")).toBeInTheDocument()

    // SLA & Review policy guidance section
    expect(screen.getByText(/Kebijakan Ulasan & SLA Revisi Tim Frhm/)).toBeInTheDocument()
    expect(screen.getByText(/SLA Revisi 1x24 Jam Kerja/)).toBeInTheDocument()
    expect(screen.getByText(/Catatan Spesifik & Terarah/)).toBeInTheDocument()
    expect(screen.getByText(/Otomatisasi Penjadwalan/)).toBeInTheDocument()
  })

  it("switches to Draf Kalender Publikasi (Batch) and displays METER intent mix & batch approval", async () => {
    renderWithProviders(<ClientReviewHub clientId="c-test-1" />)

    const batchTab = screen.getByRole("button", { name: /Draf Kalender Publikasi/i })
    fireEvent.click(batchTab)

    expect(screen.getByText(/Audit Algoritma METER & Intent Mix/)).toBeInTheDocument()
    expect(screen.getByText(/Panduan Seduh V60 Taraju/)).toBeInTheDocument()
    expect(screen.getByText(/Kisah Sang Petani Kopi/)).toBeInTheDocument()

    // 1-Click Batch Approval button
    const batchApproveBtn = screen.getByRole("button", { name: /Setujui Seluruh Jadwal Minggu Ini/i })
    expect(batchApproveBtn).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(batchApproveBtn)
    })
    expect(mockScheduledPostMutateAsync).toHaveBeenCalled()
  })

  it("triggers single post approval when clicking Setujui Post Ini", async () => {
    renderWithProviders(<ClientReviewHub clientId="c-test-1" />)

    const batchTab = screen.getByRole("button", { name: /Draf Kalender Publikasi/i })
    fireEvent.click(batchTab)

    const singleApproveButtons = screen.getAllByRole("button", { name: /Setujui Post Ini/i })
    expect(singleApproveButtons.length).toBeGreaterThan(0)

    fireEvent.click(singleApproveButtons[0])
    expect(mockScheduledPostMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "post-1",
        clientId: "c-test-1",
        status: "scheduled",
      }),
      expect.anything()
    )
  })
})
