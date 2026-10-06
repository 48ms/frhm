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
    listAll: () => ({
      queryKey: ["scheduled_posts", "list-all"],
      queryFn: async () => [],
    }),
  },
}))

function renderView() {
  return renderWithProviders(<ErpDashboardClient />)
}

describe("ErpDashboardClient", () => {
  it("renders the ERP title and summary strip", async () => {
    renderView()

    expect(await screen.findByRole("heading", { name: /^Dashboard$/i })).toBeDefined()
    expect(screen.getByText(/TOTAL DELIVERABLE/i)).toBeDefined()
  })

  it("renders the status badge labels verbatim from the reference", async () => {
    renderView()

    expect(await screen.findByText(/Menunggu review client/i)).toBeDefined()
    expect(screen.getByText(/Perlu revisi dari kamu/i)).toBeDefined()
    expect(screen.getByText(/Disetujui, siap publish/i)).toBeDefined()
  })

  it("renders the per-client section and today's schedule banner", async () => {
    renderView()

    expect(await screen.findByRole("heading", { name: /Per Client/i })).toBeDefined()
    expect(screen.getByRole("heading", { name: /Jadwal Tayang Hari Ini/i })).toBeDefined()
    expect(screen.getByText(/Tidak ada jadwal tayang hari ini/i)).toBeDefined()
  })

  it("shows a real channel count per client, not a hardcoded progress value", async () => {
    renderView()

    // The old mock printed "Progres skill"; the real UI shows connected channels.
    expect(await screen.findByText(/Channel Terhubung/i)).toBeDefined()
    expect(screen.queryByText(/Progres skill/i)).toBeNull()
    // 2 channel nyata, bukan angka progress hardcoded.
    expect(screen.getByText("2 / 10")).toBeDefined()
  })

  it("does not render a fabricated admin email derived from the client id", async () => {
    renderView()

    await screen.findByRole("heading", { name: /^Dashboard$/i })
    // Regression: the mock built "admin@<id-part>.com" which produced garbage.
    expect(screen.queryByText(/@.*\.com/)).toBeNull()
  })
})
