import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// Mock hooks
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/dashboard",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock("@/components/dashboard-stitch/dashboard-data", () => ({
  useActiveDashboard: () => ({
    clientId: "client-123",
    clients: [{ id: "client-123", name: "Test Client" }],
    setClientId: vi.fn(),
  }),
}))

vi.mock("@/components/client/create-client-provider", () => ({
  useCreateClient: () => ({ openCreateClient: vi.fn() }),
}))

describe("AppSidebar", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  function renderSidebar() {
    return render(
      <QueryClientProvider client={queryClient}>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar user={{ name: "Bima", email: "bima@frhm.com", avatar: "" }} />
        </SidebarProvider>
      </QueryClientProvider>
    )
  }

  it("renders navigation and sets aria-current on active link", () => {
    renderSidebar()

    // The Overview link should be present and marked active
    const overviewLinks = screen.getAllByRole("link", { name: /overview/i })
    expect(overviewLinks.length).toBeGreaterThan(0)
    expect(overviewLinks[0]).toHaveAttribute("aria-current", "page")
  })

  it("applies proper client_id parameter to all links", () => {
    renderSidebar()

    const composerLinks = screen.getAllByRole("link", { name: /new post/i })
    expect(composerLinks[0]).toHaveAttribute("href", "/admin/composer?clientId=client-123")
  })
})
