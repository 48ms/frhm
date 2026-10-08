import { screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ErpDashboardClient } from "./erp-client"
import { renderWithProviders } from "@/test/render-with-providers"

// Data nyata datang dari Supabase (socialQueries.listClientsWithChannels).
// Kita beri satu client dengan 2 channel supaya hitungan channel teruji tanpa
// menyentuh store Zustand lama (yang sudah tidak dipakai komponen ini).
vi.mock("@/features/social-accounts/api/queries", () => ({
  socialQueries: {
    listClientsWithChannels: () => ({
      queryKey: ["social", "clients-with-channels"],
      queryFn: async () => [
        {
          id: "client-shell",
          name: "Shell Reps",
          contact_email: null,
          contact_phone: null,
          brand_profile: null,
          created_at: null,
          updated_at: null,
          channels: [
            { id: "ch-1", platform: "instagram", handle: "@shell" },
            { id: "ch-2", platform: "tiktok", handle: "@shell.creative" },
          ],
        },
      ],
    }),
  },
}))

vi.mock("@/features/scheduled-posts/api/queries", () => ({
  scheduledPostQueries: {
    listByClient: () => ({
      queryKey: ["scheduled_posts", "list", { clientId: "client-shell" }],
      queryFn: async () => [],
    }),
  },
}))

vi.mock("@/features/deliverables/api/queries", () => ({
  deliverableQueries: {
    listByClient: () => ({
      queryKey: ["deliverables", "client", "client-shell"],
      queryFn: async () => [
        { id: "d1", status: "sent", client_id: "client-shell" },
        { id: "d2", status: "approved", client_id: "client-shell" },
      ],
    }),
  },
}))

vi.mock("@/components/dashboard-stitch/dashboard-data", () => ({
  useActiveDashboard: () => ({
    clientId: "client-shell",
    setClientId: vi.fn(),
    client: {
      id: "client-shell",
      name: "Shell Reps",
      channels: [
        { id: "ch-1", platform: "instagram", handle: "@shell" },
        { id: "ch-2", platform: "tiktok", handle: "@shell.creative" },
      ],
    },
    profile: null,
    clients: [],
  }),
}))

function renderView() {
  return renderWithProviders(<ErpDashboardClient />)
}

describe("ErpDashboardClient", () => {
  it("renders the ERP title and summary strip", async () => {
    renderView()

    expect(await screen.findByRole("heading", { name: /^Dashboard$/i })).toBeDefined()
    expect(screen.getAllByText(/TOTAL DELIVERABLE/i).length).toBeGreaterThan(0)
  })

  it("renders the status badge labels verbatim from the reference", async () => {
    renderView()

    expect(await screen.findByText(/Menunggu review client/i)).toBeDefined()
    expect(screen.getByText(/Perlu revisi dari kamu/i)).toBeDefined()
    expect(screen.getByText(/Disetujui, siap publish/i)).toBeDefined()
  })

  it("renders the per-client section and today's schedule banner", async () => {
    renderView()

    expect(await screen.findByRole("heading", { name: /Klien Aktif/i })).toBeDefined()
    expect(screen.getByRole("heading", { name: /Jadwal Tayang Hari Ini/i })).toBeDefined()
    expect(screen.getByText(/Tidak ada jadwal tayang hari ini/i)).toBeDefined()
  })

  it("shows a real channel count per client, not a hardcoded progress value", async () => {
    renderView()

    // The old mock printed "Progres skill"; the real UI shows connected channels.
    expect(await screen.findByText(/Channel Terhubung/i)).toBeDefined()
    expect(screen.queryByText(/Progres skill/i)).toBeNull()
    // 2 channel nyata, bukan angka progress hardcoded. Cari berdasarkan DOM textContent.
    expect(
      document.body.textContent?.includes("2 / 10") ?? false
    ).toBe(true)
  })

  it("does not render a fabricated admin email derived from the client id", async () => {
    renderView()

    await screen.findByRole("heading", { name: /^Dashboard$/i })
    // Regression: the mock built "admin@<id-part>.com" which produced garbage.
    expect(screen.queryByText(/@.*\.com/)).toBeNull()
  })
})
