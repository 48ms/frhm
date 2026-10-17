import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ClientDashboardView } from "./client-dashboard-view"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/client/dashboard",
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
          title: "Draf Carousel Peluncuran Menu Baru",
          content_md: "Konten promosi peluncuran menu.",
          external_link: null,
          status: "sent",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    })),
  },
}))

vi.mock("@/features/scheduled-posts/api/queries", () => ({
  scheduledPostQueries: {
    listByClient: vi.fn(() => ({
      queryKey: ["scheduled_posts", "list", "c-test-1"],
      queryFn: () => [
        {
          id: "post-1",
          client_id: "c-test-1",
          title: "Promo Weekend Seru",
          content: "Diskon 20% khusus kopi susu!",
          platform: "instagram",
          scheduled_at: new Date(Date.now() + 86400000).toISOString(),
          status: "scheduled",
        },
      ],
    })),
  },
}))

vi.mock("@/features/social-accounts/api/queries", () => ({
  socialQueries: {
    listClientsWithChannels: vi.fn(() => ({
      queryKey: ["clients", "with_channels"],
      queryFn: () => [
        {
          id: "c-test-1",
          name: "Taraju Coffee",
          channels: [
            {
              id: "chan-1",
              client_id: "c-test-1",
              platform: "instagram",
              handle: "tarajucoffee",
              status: "terhubung",
            },
          ],
        },
      ],
    })),
  },
}))

describe("ClientDashboardView", () => {
  function renderWithProviders(ui: React.ReactElement) {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    )
  }

  it("renders executive metrics, deliverables review pipeline, connected channels, and collaboration flow", async () => {
    renderWithProviders(<ClientDashboardView clientId="c-test-1" />)

    // Greeting & Top Metrics
    expect(await screen.findByText(/Halo, Taraju Coffee/)).toBeInTheDocument()
    expect(screen.getByText("Konten Siap Review")).toBeInTheDocument()
    expect(screen.getByText("Konten Disetujui")).toBeInTheDocument()
    expect(screen.getByText("Jadwal Kalender Aktif")).toBeInTheDocument()
    expect(screen.getByText("Kanal Terhubung")).toBeInTheDocument()

    // Deliverables Review Pipeline (New Section eliminating dead space)
    expect(screen.getByText(/Antrean Materi & Ulasan Kreatif/)).toBeInTheDocument()
    expect(screen.getByText("Draf Carousel Peluncuran Menu Baru")).toBeInTheDocument()

    // Connected Channels Section
    expect(screen.getByText("Kanal Brand Aktif")).toBeInTheDocument()
    expect(screen.getByText("@tarajucoffee")).toBeInTheDocument()

    // METER Signal Audit & Strategic Recommendations
    expect(screen.getByText(/Audit Sinyal Mingguan & Rekomendasi METER/)).toBeInTheDocument()
    expect(screen.getByText(/3 Rekomendasi Taktis Pekan Ini/)).toBeInTheDocument()

    // 3-Step Collaboration Guidance
    expect(screen.getByText(/Alur Kolaborasi Konten Bersama Frhm/)).toBeInTheDocument()
    expect(screen.getByText(/Produksi & Riset Kreatif/)).toBeInTheDocument()
    expect(screen.getByText(/Tinjau & Approval Instan/)).toBeInTheDocument()
    expect(screen.getByText(/Otomatis Tayang Terjadwal/)).toBeInTheDocument()
  })
})
