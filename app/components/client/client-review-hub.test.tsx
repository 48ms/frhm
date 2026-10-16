import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
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
    mutate: vi.fn(),
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
})
