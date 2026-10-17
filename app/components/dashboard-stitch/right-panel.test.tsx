import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RightPanel } from "./right-panel"

const CLIENT_NAME = "Frhm Alpha Tester"

vi.mock("./dashboard-data", () => ({
  useActiveDashboard: () => ({
    client: {
      id: "test-client",
      name: CLIENT_NAME,
      channels: [
        { id: "ch1", platform: "instagram", handle: "@frhm", status: "terhubung", note: null, avatar_url: null, confirmed_at: null, created_at: "", updated_at: "" },
      ],
    },
    profile: {
      velocity: 5,
      peak_label: "Peak",
      peak_value: "2,500",
      insights: [],
      metrics: [],
    },
  }),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/admin",
}))

vi.mock("@/features/copilot/api/queries", () => ({
  useGenerateContentIdeas: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock("@/features/social-accounts/api/queries", () => ({
  useDisconnectChannel: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useConnectChannel: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<any>()
  const filterMotionProps = ({ whileHover, whileTap, variants, transition, initial, animate, exit, ...rest }: any) => rest
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => <div {...filterMotionProps(props)}>{children}</div>,
      section: ({ children, ...props }: any) => <section {...filterMotionProps(props)}>{children}</section>,
      span: ({ children, ...props }: any) => <span {...filterMotionProps(props)}>{children}</span>,
      button: ({ children, ...props }: any) => <button {...filterMotionProps(props)}>{children}</button>,
    },
  }
})

describe("RightPanel (G4: client name truncation)", () => {
  it("renders full client name in sentences, not substring(0,5)", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <RightPanel />
      </QueryClientProvider>
    )

    // Kalimat verification note: "Channels belong to <name>"
    expect(screen.getByText(/Channels belong to/)).toBeInTheDocument()
    expect(screen.getAllByText(CLIENT_NAME, { exact: false })[0]).toBeInTheDocument()

    // Tidak boleh ada teks "Frhm" tanpa "Alpha" (truncation artifact)
    const truncated = screen.queryByText("Frhm", { exact: true })
    expect(truncated).toBeNull()
  })

  it("renders 3 Rekomendasi Mingguan widget with METER Closed-Loop badge", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    render(
      <QueryClientProvider client={queryClient}>
        <RightPanel />
      </QueryClientProvider>
    )

    expect(screen.getByText("3 Rekomendasi Mingguan")).toBeInTheDocument()
    expect(screen.getByText("METER Closed-Loop")).toBeInTheDocument()
  })
})
