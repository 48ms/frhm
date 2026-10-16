import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import * as React from "react"
import { AdminSupportTicketsDialog } from "./admin-support-tickets-dialog"
import type { AdminSupportTicket } from "@/features/support/api/types"

const mockMutate = vi.fn()
const mockUseAllSupportTickets = vi.fn()
const mockUseUpdateSupportTicket = vi.fn()

vi.mock("@/features/support/api/queries", () => ({
  useAllSupportTickets: () => mockUseAllSupportTickets(),
  useUpdateSupportTicket: () => mockUseUpdateSupportTicket(),
}))

const mockTickets: AdminSupportTicket[] = [
  {
    id: "ticket-1",
    client_id: "client-taraju",
    client_name: "Taraju Coffee",
    subject: "Revisi video reels promo",
    message: "Tolong ganti backsound di detik ke 15 dengan lagu yang lebih upbeat.",
    priority: "High",
    status: "open",
    admin_reply: null,
    resolved_at: null,
    created_by: "user-1",
    created_at: "2026-10-15T10:00:00Z",
    updated_at: "2026-10-15T10:00:00Z",
  },
  {
    id: "ticket-2",
    client_id: "client-pawon",
    client_name: "Pawon Sengon",
    subject: "Jadwal posting dadakan",
    message: "Ada promo weekend flash sale, mohon post besok jam 12.",
    priority: "Urgent",
    status: "in_progress",
    admin_reply: "Tim sedang menjadwalkan konten ini.",
    resolved_at: null,
    created_by: "user-2",
    created_at: "2026-10-16T08:00:00Z",
    updated_at: "2026-10-16T08:30:00Z",
  },
  {
    id: "ticket-3",
    client_id: "client-taraju",
    client_name: "Taraju Coffee",
    subject: "Akses feed Instagram",
    message: "Sudah oke semua.",
    priority: "Normal",
    status: "resolved",
    admin_reply: "Sama-sama pak!",
    resolved_at: "2026-10-14T09:00:00Z",
    created_by: "user-1",
    created_at: "2026-10-14T08:00:00Z",
    updated_at: "2026-10-14T09:00:00Z",
  },
]

describe("AdminSupportTicketsDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAllSupportTickets.mockReturnValue({
      data: mockTickets,
      isLoading: false,
    })
    mockUseUpdateSupportTicket.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    })
  })

  it("renders ticket list and summary badges correctly when open", () => {
    render(<AdminSupportTicketsDialog open={true} onOpenChange={vi.fn()} />)

    expect(screen.getByText("Inbox Tiket Dukungan Klien")).toBeDefined()
    expect(screen.getByText("Revisi video reels promo")).toBeDefined()
    expect(screen.getByText("Jadwal posting dadakan")).toBeDefined()
    expect(screen.getByText("Akses feed Instagram")).toBeDefined()
  })

  it("filters tickets by tab (Menunggu / Diproses / Selesai)", () => {
    render(<AdminSupportTicketsDialog open={true} onOpenChange={vi.fn()} />)

    // Click tab "Menunggu"
    const openTab = screen.getByRole("tab", { name: /Menunggu/i })
    fireEvent.click(openTab)

    expect(screen.getByText("Revisi video reels promo")).toBeDefined()
    expect(screen.queryByText("Jadwal posting dadakan")).toBeNull()
    expect(screen.queryByText("Akses feed Instagram")).toBeNull()
  })

  it("shows ticket details and allows admin to reply and resolve ticket", () => {
    render(<AdminSupportTicketsDialog open={true} onOpenChange={vi.fn()} />)

    // Click on the first ticket item via testid
    const ticketItem = screen.getByTestId("ticket-item-ticket-1")
    fireEvent.click(ticketItem)

    // Details pane should be visible (there is message in the list item and message in the detail pane)
    const messages = screen.getAllByText(
      "Tolong ganti backsound di detik ke 15 dengan lagu yang lebih upbeat."
    )
    expect(messages.length).toBeGreaterThanOrEqual(1)

    // Type a reply
    const replyInput = screen.getByTestId("admin-ticket-reply-textarea")
    fireEvent.change(replyInput, {
      target: { value: "Sudah diperbarui dengan audio trending BGM 2." },
    })

    // Click Kirim & Selesaikan
    const resolveBtn = screen.getByRole("button", { name: /Kirim & Selesaikan/i })
    fireEvent.click(resolveBtn)

    expect(mockMutate).toHaveBeenCalledTimes(1)
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketId: "ticket-1",
        clientId: "client-taraju",
        status: "resolved",
        adminReply: "Sudah diperbarui dengan audio trending BGM 2.",
      }),
      expect.any(Object)
    )
  })

  it("allows setting status to in_progress", () => {
    render(<AdminSupportTicketsDialog open={true} onOpenChange={vi.fn()} />)

    const ticketItem = screen.getByTestId("ticket-item-ticket-1")
    fireEvent.click(ticketItem)

    const inProgressBtn = screen.getByRole("button", { name: /Tandai Diproses/i })
    fireEvent.click(inProgressBtn)

    expect(mockMutate).toHaveBeenCalledTimes(1)
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketId: "ticket-1",
        status: "in_progress",
      }),
      expect.any(Object)
    )
  })

  it("filters tickets by initialClientId when provided", () => {
    render(
      <AdminSupportTicketsDialog
        open={true}
        onOpenChange={vi.fn()}
        initialClientId="client-pawon"
      />
    )

    expect(screen.getByText("Jadwal posting dadakan")).toBeDefined()
    expect(screen.queryByText("Revisi video reels promo")).toBeNull()
  })
})
