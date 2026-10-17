import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ClientFooter } from "./client-footer"

describe("ClientFooter Component", () => {
  it("renders partner portal badge and platform description", () => {
    render(<ClientFooter clientId="client-123" clientName="Taraju Coffee" />)

    expect(screen.getByText("FRHM")).toBeDefined()
    expect(screen.getByText("Partner Portal")).toBeDefined()
    expect(screen.getByText("Ruang Kolaborasi Taraju Coffee")).toBeDefined()
    expect(screen.getByText("Sistem Aktif")).toBeDefined()
  })

  it("links to review policy, calendar dispatch, and support hotline with clientId query", () => {
    render(<ClientFooter clientId="client-123" clientName="Pawon Sengon" />)

    const reviewLink = screen.getByRole("link", { name: /Kebijakan Review & SLA/i })
    expect(reviewLink.getAttribute("href")).toBe("/client/review?clientId=client-123")

    const calendarLink = screen.getByRole("link", { name: /Jadwal Publikasi/i })
    expect(calendarLink.getAttribute("href")).toBe("/client/calendar?clientId=client-123")

    const supportLink = screen.getByRole("link", { name: /Hotline Bantuan/i })
    expect(supportLink.getAttribute("href")).toBe("/client/support?clientId=client-123")
  })
})
