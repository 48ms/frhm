import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { DashboardStitchChart } from "./performance-chart"
import { useQuery } from "@tanstack/react-query"

// Mock useActiveDashboard
const mockDashboardData = {
  client: {
    id: "test-client-123",
    name: "InterviewBrand 0921",
    channels: [
      {
        id: "ch-1",
        platform: "youtube",
        handle: "@taraju_qa_stream",
        status: "terhubung",
        avatar_url: null,
      },
    ],
  },
  clientId: "test-client-123",
  profile: {
    peak_label: "Peak Performance",
    peak_value: "0%",
    metrics: [
      { label: "Total Reach", value: "0", delta: "N/A", trend: "neutral", spark: [10, 20, 30] },
      { label: "Engagement Rate", value: "0%", delta: "N/A", trend: "neutral", spark: [5, 10, 15] },
    ],
    insights: [],
  },
}

vi.mock("./dashboard-data", () => ({
  useActiveDashboard: () => mockDashboardData,
}))

vi.mock("nuqs", () => ({
  useQueryState: () => ["30d", vi.fn()],
  parseAsStringEnum: () => ({ withDefault: () => {} }),
}))

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    useQuery: vi.fn(),
  }
})

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="recharts-container">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}))

vi.mock("@/components/animate-ui/components/texts/metric-ticker", () => ({
  MetricTicker: ({ value }: { value: any }) => <span>{String(value)}</span>,
}))

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<any>()
  const filterMotionProps = ({ whileHover, whileTap, variants, transition, initial, animate, exit, ...rest }: any) => rest
  return {
    ...actual,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => <div {...filterMotionProps(props)}>{children}</div>,
      span: ({ children, ...props }: any) => <span {...filterMotionProps(props)}>{children}</span>,
    },
  }
})

describe("DashboardStitchChart (Multi-Channel Performance Breakdown)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders header, chart dynamics, and multi-channel breakdown section", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: {
        platformList: [
          {
            platform: "youtube",
            accountHandle: "@taraju_qa_stream",
            accountStatus: "terhubung",
            postCount: 0,
            totalReach: 0,
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            totalShares: 0,
            totalSaves: 0,
            totalClicks: 0,
            totalInquiries: 0,
            engagementRate: 0,
          },
        ],
      },
      isLoading: false,
    } as any)

    render(<DashboardStitchChart />)

    // Cek judul utama
    expect(screen.getByText("Performance & Engagement Dynamics")).toBeInTheDocument()
    expect(screen.getByText(/Audience trajectory · InterviewBrand 0921/i)).toBeInTheDocument()

    // Cek header breakdown multi-channel
    expect(screen.getByText("Performa Saluran Media Sosial")).toBeInTheDocument()
    expect(screen.getByText("Multi-Channel")).toBeInTheDocument()
    expect(screen.getByText("1 Akun Terpantau")).toBeInTheDocument()

    // Cek kartu akun channel YouTube
    expect(screen.getByText("YouTube")).toBeInTheDocument()
    expect(screen.getByText("@taraju_qa_stream")).toBeInTheDocument()
    expect(screen.getByText("Terhubung")).toBeInTheDocument()
    expect(screen.getByText(/Belum ada tayangan periode 30D/i)).toBeInTheDocument()
  })

  it("renders empty state notice when client has zero connected channels", () => {
    vi.mocked(useQuery).mockReturnValue({
      data: {
        platformList: [],
      },
      isLoading: false,
    } as any)

    // Override client with no channels
    const origChannels = mockDashboardData.client.channels
    mockDashboardData.client.channels = []

    render(<DashboardStitchChart />)

    expect(screen.getByText("Belum Ada Saluran Terhubung")).toBeInTheDocument()
    expect(screen.getByText(/Hubungkan akun sosial di panel Connected Hub/i)).toBeInTheDocument()

    mockDashboardData.client.channels = origChannels
  })
})
