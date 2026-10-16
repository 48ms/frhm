import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ErpDashboardClient } from "./erp-client"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}))

vi.mock("@/components/dashboard-stitch/dashboard-data", () => ({
  useActiveDashboard: () => ({
    clientId: "c-test-erp",
    client: {
      id: "c-test-erp",
      name: "Pawon Sengon",
      channels: [{ id: "ch-1" }, { id: "ch-2" }],
    },
  }),
}))

vi.mock("@/features/scheduled-posts/api/queries", () => ({
  scheduledPostQueries: {
    listByClient: () => ({
      queryKey: ["posts", "c-test-erp"],
      queryFn: async () => [],
    }),
  },
}))

vi.mock("@/features/deliverables/api/queries", () => ({
  deliverableQueries: {
    listByClient: () => ({
      queryKey: ["deliverables", "c-test-erp"],
      queryFn: async () => [
        {
          id: "deliv-1",
          client_id: "c-test-erp",
          title: "Q4 Brand Strategy Document",
          type: "strategy",
          status: "sent",
          content_md: "Overview of Q4 campaign objectives",
          created_at: "2026-10-15T00:00:00Z",
        },
        {
          id: "deliv-2",
          client_id: "c-test-erp",
          title: "TikTok Reels Batch Plan",
          type: "content",
          status: "approved",
          content_md: "10 short video scripts",
          created_at: "2026-10-14T00:00:00Z",
        },
      ],
    }),
  },
  useUpdateDeliverableStatus: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useScheduleApprovedDeliverable: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock("@/features/erp/api/queries", () => ({
  useSendTelegramTest: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

import { NuqsTestingAdapter } from "nuqs/adapters/testing"

describe("ErpDashboardClient URL State & Filtering", () => {
  function renderWithProviders() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return render(
      <NuqsTestingAdapter>
        <QueryClientProvider client={queryClient}>
          <ErpDashboardClient />
        </QueryClientProvider>
      </NuqsTestingAdapter>
    )
  }

  it("renders page header, status filter tabs, and search input", async () => {
    renderWithProviders()
    expect(screen.getByText("Dashboard")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Cari deliverable...")).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Semua/ })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Menunggu Review/ })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Disetujui/ })).toBeInTheDocument()
  })

  it("displays deliverables loaded from database", async () => {
    renderWithProviders()
    expect(await screen.findByText("Q4 Brand Strategy Document")).toBeInTheDocument()
    expect(await screen.findByText("TikTok Reels Batch Plan")).toBeInTheDocument()
  })
})
