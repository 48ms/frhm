import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { DashboardStitchKpis } from "./kpi-grid"

// Mock useActiveDashboard
vi.mock("./dashboard-data", () => ({
  useActiveDashboard: () => ({
    client: { id: "test-client", name: "Frhm Alpha Tester", channels: [] },
    profile: {
      velocity: 5,
      metrics: [
        { label: "Total Reach", value: "2,500", delta: "N/A", trend: "neutral", spark: [0, 0, 0, 0] },
        { label: "Engagement Rate", value: "4.2%", delta: "N/A", trend: "neutral", spark: [0, 0, 0, 0] },
        { label: "Total Engagement", value: "105", delta: "N/A", trend: "neutral", spark: [0, 0, 0, 0] },
      ],
    },
  }),
}))

// Mock useScheduledPosts to verify factual queue counting
vi.mock("@/features/scheduled-posts/api/queries", () => ({
  useScheduledPosts: () => ({
    data: [
      { id: "post-1", title: "Post Terjadwal", status: "scheduled" },
      { id: "post-2", title: "Draf Konten", status: "draft" },
      { id: "post-3", title: "Post Terbit", status: "published" },
    ],
    isPending: false,
  }),
}))

// Mock motion/react to simple div/span while preserving hooks
vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<any>()
  const filterMotionProps = ({ whileHover, whileTap, variants, transition, initial, animate, exit, ...rest }: any) => rest
  return {
    ...actual,
    useInView: () => true,
    motion: {
      ...actual.motion,
      section: ({ children, ...props }: any) => <section {...filterMotionProps(props)}>{children}</section>,
      div: ({ children, ...props }: any) => <div {...filterMotionProps(props)}>{children}</div>,
      span: ({ children, ...props }: any) => <span {...filterMotionProps(props)}>{children}</span>,
    },
  }
})

describe("DashboardStitchKpis (Data Integrity & Design)", () => {
  it("renders factual Total engagement label instead of conflicting Content velocity", () => {
    render(<DashboardStitchKpis />)
    
    // Harus ada Total reach dan Engagement rate
    expect(screen.getByText("Total reach")).toBeInTheDocument()
    expect(screen.getByText("2,500")).toBeInTheDocument()
    
    expect(screen.getByText("Avg. engagement")).toBeInTheDocument()
    expect(screen.getByText("4.2%")).toBeInTheDocument()

    // Metriks ke-4 harus merefleksikan Total engagement (nilai 105), bukan klaim velocity
    expect(screen.getByText("Total engagement")).toBeInTheDocument()
    expect(screen.getByText("105")).toBeInTheDocument()

    // Metriks ke-2 (Scheduled queue) harus merefleksikan 1 post berstatus scheduled (dari 3 post)
    expect(screen.getByText("Scheduled queue")).toBeInTheDocument()
    expect(screen.getByText("1 Posts")).toBeInTheDocument()
    expect(screen.getByText("3 total in pipeline")).toBeInTheDocument()
  })

  it("renders N/A badge with neutral muted style, not destructive/error red", () => {
    render(<DashboardStitchKpis />)
    
    const naBadges = screen.getAllByText("N/A")
    expect(naBadges.length).toBeGreaterThan(0)
    
    // Tidak boleh ada badge N/A yang memiliki kelas bg-destructive
    for (const badge of naBadges) {
      expect(badge.className).not.toContain("bg-destructive")
      expect(badge.className).not.toContain("text-destructive")
      // Harus menggunakan style netral/muted
      expect(badge.className).toMatch(/bg-muted|border-border|text-muted-foreground/)
    }
  })

  it("renders METER signal focus bar highlighting Saves & Sends over vanity", () => {
    render(<DashboardStitchKpis />)
    expect(screen.getByText(/METER Signal Focus/)).toBeInTheDocument()
    expect(screen.getByText(/Saves & Sends/)).toBeInTheDocument()
    expect(screen.getByText(/Shares & Completion/)).toBeInTheDocument()
    expect(screen.getByText(/Dwell & ER by reach/)).toBeInTheDocument()
  })
})

