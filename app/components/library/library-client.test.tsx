import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { LibraryClient } from "./library-client"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}))

vi.mock("@/components/dashboard-stitch/dashboard-data", () => ({
  useActiveDashboard: () => ({
    clientId: "c-test-1",
    client: { id: "c-test-1", name: "Taraju Brand" },
  }),
}))

vi.mock("@/features/library/api/service", () => ({
  listAssets: vi.fn().mockResolvedValue([
    {
      id: "asset-1",
      client_id: "c-test-1",
      publicId: "product_launch_poster",
      url: "https://example.com/asset1.jpg",
      fileType: "image",
      tags: ["promo", "q4"],
      size: 1024,
      width: 1080,
      height: 1080,
      created_at: "2026-10-15T00:00:00Z",
    },
    {
      id: "asset-2",
      client_id: "c-test-1",
      publicId: "reel_bts",
      url: "https://example.com/asset2.mp4",
      fileType: "video",
      tags: ["reels", "bts"],
      size: 2048,
      width: 1080,
      height: 1920,
      created_at: "2026-10-15T00:00:00Z",
    },
  ]),
  uploadAsset: vi.fn(),
  deleteAsset: vi.fn(),
  deleteAssets: vi.fn(),
  tagAssets: vi.fn(),
  reorderAssets: vi.fn().mockResolvedValue({ success: true }),
}))

import { NuqsTestingAdapter } from "nuqs/adapters/testing"

describe("LibraryClient URL State & Filtering", () => {
  function renderWithProviders() {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    return render(
      <NuqsTestingAdapter>
        <QueryClientProvider client={queryClient}>
          <LibraryClient />
        </QueryClientProvider>
      </NuqsTestingAdapter>
    )
  }

  it("renders media library container and search filter controls", async () => {
    renderWithProviders()
    expect(screen.getByText("Media Library")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Cari file, caption, tag...")).toBeInTheDocument()
    expect(screen.getByText("All Assets")).toBeInTheDocument()
    expect(screen.getAllByText("Images").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Videos").length).toBeGreaterThan(0)
  })

  it("displays assets loaded from service", async () => {
    renderWithProviders()
    expect(await screen.findByAltText("product_launch_poster")).toBeInTheDocument()
    expect(await screen.findByAltText("reel_bts")).toBeInTheDocument()
  })
})
