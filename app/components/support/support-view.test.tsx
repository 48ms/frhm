import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SupportView } from "./support-view"

vi.mock("@/components/dashboard-stitch/dashboard-data", () => ({
  useActiveDashboard: () => ({
    client: { id: "client-1", name: "Shell Reps" },
  }),
}))

vi.mock("@/features/support/api/queries", () => ({
  supportTicketQueries: {
    listByClient: (clientId: string) => ({
      queryKey: ["support-tickets", "client", clientId],
      queryFn: async () => [],
    }),
  },
  useCreateSupportTicket: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

if (typeof window !== "undefined") {
  window.scrollTo = vi.fn()
}

describe("SupportView", () => {
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

  it("renders support channels and empty tickets state", async () => {
    renderWithProviders(<SupportView />)
    expect(screen.getByText("Support Center")).toBeInTheDocument()
    expect(screen.getByText("Email Support")).toBeInTheDocument()
    expect(screen.getByText("Priority Live Chat")).toBeInTheDocument()
    expect(screen.getByText("Knowledge Base")).toBeInTheDocument()
    expect(await screen.findByText("Belum ada tiket")).toBeInTheDocument()
  })
})
