import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NavUser } from "./nav-user"
import { SidebarProvider } from "@/components/ui/sidebar"

const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
}))

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}))

describe("NavUser Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function renderNavUser(props: {
    user: { name: string; email: string; avatar?: string; role?: string }
    open?: boolean
  }) {
    return render(
      <SidebarProvider defaultOpen={props.open ?? true}>
        <NavUser user={props.user} />
      </SidebarProvider>
    )
  }

  it("renders user name and 'Agency Administrator' role for admin users", () => {
    renderNavUser({
      user: {
        name: "Bima Maulana",
        email: "bima@frhm.app",
        role: "admin",
      },
    })

    expect(screen.getByText("Bima Maulana")).toBeInTheDocument()
    expect(screen.getByText("Agency Administrator")).toBeInTheDocument()
    expect(screen.getByText("BM")).toBeInTheDocument()
  })

  it("renders user name and 'Client Partner' role for client users", () => {
    renderNavUser({
      user: {
        name: "Pak Adit",
        email: "adit@taraju.com",
        role: "client",
      },
    })

    expect(screen.getByText("Pak Adit")).toBeInTheDocument()
    expect(screen.getByText("Client Partner")).toBeInTheDocument()
    expect(screen.getByText("PA")).toBeInTheDocument()
  })

  it("opens dropdown menu with settings, support, and sign out options", async () => {
    renderNavUser({
      user: {
        name: "Bima Maulana",
        email: "bima@frhm.app",
        role: "admin",
      },
    })

    const trigger = screen.getByRole("button", { name: /Menu Akun: Bima Maulana/i })
    fireEvent.pointerDown(trigger, { button: 0 })
    fireEvent.keyDown(trigger, { key: "Enter" })

    await waitFor(() => {
      // Items inside dropdown
      expect(screen.getByText("Pengaturan Workspace")).toBeInTheDocument()
      expect(screen.getByText("Bantuan & Dukungan")).toBeInTheDocument()
      expect(screen.getByText("Keluar (Sign Out)")).toBeInTheDocument()
    })
  })

  it("navigates to settings on Pengaturan Workspace click", async () => {
    renderNavUser({
      user: {
        name: "Bima Maulana",
        email: "bima@frhm.app",
        role: "admin",
      },
    })

    const trigger = screen.getByRole("button", { name: /Menu Akun: Bima Maulana/i })
    fireEvent.pointerDown(trigger, { button: 0 })
    fireEvent.keyDown(trigger, { key: "Enter" })

    await waitFor(() => {
      expect(screen.getByText("Pengaturan Workspace")).toBeInTheDocument()
    })

    const settingsItem = screen.getByText("Pengaturan Workspace")
    fireEvent.click(settingsItem)

    expect(mockPush).toHaveBeenCalledWith("/admin/settings")
  })
})
