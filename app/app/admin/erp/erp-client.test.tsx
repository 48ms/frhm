import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { ErpDashboardClient } from "./erp-client"
import { useAppStore } from "@/lib/store/app-store"

describe("ErpDashboardClient", () => {
  it("renders the ERP title and summary strip", () => {
    render(<ErpDashboardClient />)

    expect(screen.getByRole("heading", { name: /^Dashboard$/i })).toBeDefined()
    expect(screen.getByText(/TOTAL DELIVERABLE/i)).toBeDefined()
  })

  it("renders the status badge labels verbatim from the reference", () => {
    render(<ErpDashboardClient />)

    expect(screen.getByText(/Menunggu review client/i)).toBeDefined()
    expect(screen.getByText(/Perlu revisi dari kamu/i)).toBeDefined()
    expect(screen.getByText(/Disetujui, siap publish/i)).toBeDefined()
  })

  it("renders the per-client section and today's schedule banner", () => {
    render(<ErpDashboardClient />)

    expect(screen.getByRole("heading", { name: /Per Client/i })).toBeDefined()
    expect(screen.getByRole("heading", { name: /Jadwal Tayang Hari Ini/i })).toBeDefined()
    expect(screen.getByText(/Tidak ada jadwal tayang hari ini/i)).toBeDefined()
  })

  it("shows a real channel count per client, not a hardcoded progress value", () => {
    // Inject mock account untuk test
    useAppStore.getState().addSocialClient({ name: "Shell Reps" })
    useAppStore.getState().connectAccount({
      clientId: useAppStore.getState().socialClients[0].id,
      platform: "Instagram",
      handle: "@test",
    })

    render(<ErpDashboardClient />)

    // The old mock printed "Progres skill"; the real UI shows connected channels.
    expect(screen.queryByText(/Progres skill/i)).toBeNull()
    expect(screen.getAllByText(/Channel Terhubung/i).length).toBeGreaterThan(0)
  })

  it("does not render a fabricated admin email derived from the client id", () => {
    render(<ErpDashboardClient />)

    // Regression: the mock built "admin@<id-part>.com" which produced garbage.
    expect(screen.queryByText(/@.*\.com/)).toBeNull()
  })
})
