import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ClientCalendarView } from "./client-calendar-view"

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
    ],
    isLoading: false,
  }),
}))

import { NuqsTestingAdapter } from "nuqs/adapters/testing"

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
})
