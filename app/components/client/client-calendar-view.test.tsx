import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ClientCalendarView } from "./client-calendar-view"
import { NuqsTestingAdapter } from "nuqs/adapters/testing"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/client/calendar",
}))

vi.mock("@/components/dashboard-stitch/dashboard-data", () => ({
  useActiveDashboard: () => ({
    clientId: "c-test-1",
    client: { id: "c-test-1", name: "Taraju Brand" },
  }),
}))

const mockMutate = vi.fn()

vi.mock("@/features/scheduled-posts/api/queries", () => ({
  useScheduledPosts: () => ({
    data: [
      {
        id: "post-1",
        client_id: "c-test-1",
        title: "Promo Weekend Seru",
        content: "Dapatkan diskon 20% khusus akhir pekan ini di Taraju Coffee!",
        platform: "instagram",
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        status: "scheduled",
        media_url: "https://example.com/promo.jpg",
        created_at: new Date().toISOString(),
      },
      {
        id: "post-2",
        client_id: "c-test-1",
        title: "Kisah Petani Kopi Taraju",
        content: "Di balik secangkir arabika Jawa Barat ada ketulusan petani lokal.",
        platform: "tiktok",
        scheduled_at: new Date(Date.now() + 172800000).toISOString(),
        status: "draft",
        media_url: null,
        created_at: new Date().toISOString(),
      },
    ],
    isLoading: false,
  }),
  useUpdateScheduledPost: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}))

describe("ClientCalendarView", () => {
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

  it("renders executive metrics, calendar view switcher, and scheduled posts", () => {
    renderWithProviders(<ClientCalendarView clientId="c-test-1" />)

    expect(screen.getByText("Content Calendar")).toBeInTheDocument()
    expect(screen.getByText("Konten Terjadwal")).toBeInTheDocument()
    expect(screen.getByText("Konten Selesai Tayang")).toBeInTheDocument()
    expect(screen.getByText("Total Rencana Konten")).toBeInTheDocument()
    expect(screen.getByText("Promo Weekend Seru")).toBeInTheDocument()
  })

  it("opens executive content preview dialog on post click", () => {
    renderWithProviders(<ClientCalendarView clientId="c-test-1" />)

    const postButton = screen.getByText("Promo Weekend Seru")
    fireEvent.click(postButton)

    expect(screen.getByText(/Materi promosi yang dijadwalkan/)).toBeInTheDocument()
    expect(screen.getByText(/Dapatkan diskon 20%/)).toBeInTheDocument()
    expect(screen.getByText("Request Revisi Jadwal")).toBeInTheDocument()
  })

  it("shows Setujui Konten button for draft posts and triggers approval mutation", () => {
    renderWithProviders(<ClientCalendarView clientId="c-test-1" />)

    const draftPost = screen.getByText("Kisah Petani Kopi Taraju")
    fireEvent.click(draftPost)

    const approveBtn = screen.getByRole("button", { name: /Setujui Konten Ini/i })
    expect(approveBtn).toBeInTheDocument()

    fireEvent.click(approveBtn)
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "post-2",
        clientId: "c-test-1",
        status: "scheduled",
      }),
      expect.anything()
    )
  })
})
