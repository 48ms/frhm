import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { SupportView } from "./support-view"

vi.mock("@/components/dashboard-stitch/dashboard-data", () => ({
  useActiveDashboard: () => ({
    activeClient: { id: "client-1", name: "Shell Reps" },
  }),
}))

describe("SupportView", () => {
  it("renders support channels and empty tickets state", () => {
    render(<SupportView />)
    expect(screen.getByText("Support Center")).toBeInTheDocument()
    expect(screen.getByText("Email Support")).toBeInTheDocument()
    expect(screen.getByText("Priority Live Chat")).toBeInTheDocument()
    expect(screen.getByText("Knowledge Base")).toBeInTheDocument()
    expect(screen.getByText("No tickets yet")).toBeInTheDocument()
  })
})
