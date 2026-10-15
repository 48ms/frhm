import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { DashboardStitchPostPipeline } from "./post-pipeline"

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("./dashboard-data", () => ({
  useActiveDashboard: () => ({
    client: {
      id: "test-client-123",
      name: "Taraju Coffee",
      channels: [],
    },
  }),
}))

const mockPosts = [
  {
    id: "post-101",
    client_id: "test-client-123",
    title: "Peluncuran Biji Arabika Gunung Halu",
    content: "Nikmati aroma wangi kopi pegunungan",
    platform: "instagram",
    scheduled_at: "2026-10-20T10:00:00Z",
    status: "scheduled",
    media_url: "https://example.com/arabika.jpg",
    author: "Bima",
  },
  {
    id: "post-102",
    client_id: "test-client-123",
    title: "Video Roastery Tour",
    content: "Behind the scenes proses roasting",
    platform: "tiktok",
    scheduled_at: "2026-10-22T14:30:00Z",
    status: "draft",
    media_url: null,
    author: "Bima",
  },
]

vi.mock("@/features/scheduled-posts/api/queries", () => ({
  useScheduledPosts: () => ({
    data: mockPosts,
    isPending: false,
  }),
  useCreateScheduledPost: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

// Mock PostDialog to verify opening and editing post
vi.mock("@/components/calendar/post-dialog", () => ({
  PostDialog: ({ isOpen, editingPost }: { isOpen: boolean; editingPost: any }) => {
    if (!isOpen) return null
    return (
      <div data-testid="post-dialog">
        <span data-testid="editing-title">{editingPost?.title}</span>
      </div>
    )
  },
}))

describe("DashboardStitchPostPipeline (Factual Interactions)", () => {
  it("renders scheduled posts from database and opens PostDialog on card click", () => {
    renderWithProviders(<DashboardStitchPostPipeline />)

    // Verify post titles render
    expect(screen.getByText("Peluncuran Biji Arabika Gunung Halu")).toBeInTheDocument()
    expect(screen.getByText("Video Roastery Tour")).toBeInTheDocument()

    // Ensure dialog is not open initially
    expect(screen.queryByTestId("post-dialog")).toBeNull()

    // Click on the first post card
    const postCard = screen.getByLabelText(/Lihat dan edit postingan: Peluncuran Biji Arabika Gunung Halu/)
    fireEvent.click(postCard)

    // Verify PostDialog opened with the clicked post
    expect(screen.getByTestId("post-dialog")).toBeInTheDocument()
    expect(screen.getByTestId("editing-title")).toHaveTextContent("Peluncuran Biji Arabika Gunung Halu")
  })

  it("navigates to calendar view on 'Lihat kalender' button click", () => {
    renderWithProviders(<DashboardStitchPostPipeline />)

    const calendarBtn = screen.getByText("Lihat kalender")
    fireEvent.click(calendarBtn)

    expect(mockPush).toHaveBeenCalledWith("/admin/calendar?clientId=test-client-123")
  })
})
