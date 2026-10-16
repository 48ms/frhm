import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import {
  ClientManager,
  ClientManagerSkeleton,
  AddClientHeaderButton,
  SupportTicketsHeaderButton,
} from "./client-manager"

const mockUseQuery = vi.fn()
const mockOpenCreateClient = vi.fn()
const mockUseAllSupportTickets = vi.fn()

vi.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

vi.mock("@/components/client/create-client-provider", () => ({
  useCreateClient: () => ({
    openCreateClient: mockOpenCreateClient,
  }),
}))

vi.mock("@/features/social-accounts/api/queries", () => ({
  socialQueries: {
    listClientsWithChannels: () => ({ queryKey: ["clients"] }),
  },
}))

vi.mock("@/features/support/api/queries", () => ({
  useAllSupportTickets: () => mockUseAllSupportTickets(),
}))

vi.mock("@/components/support/admin-support-tickets-dialog", () => ({
  AdminSupportTicketsDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="support-tickets-dialog">Admin Support Tickets Modal</div> : null,
}))

vi.mock("./client-playbooks-dialog", () => ({
  ClientPlaybooksDialog: ({ open, clientName }: { open: boolean; clientName: string }) =>
    open ? <div data-testid="playbooks-dialog">Playbooks Modal for {clientName}</div> : null,
}))

vi.mock("@/components/ai/brand-brain-editor-dialog", () => ({
  BrandBrainEditorDialog: ({ open, clientName }: { open: boolean; clientName: string }) =>
    open ? <div data-testid="brand-brain-dialog">Brand Brain Modal for {clientName}</div> : null,
}))

vi.mock("./edit-client-dialog", () => ({
  EditClientDialog: ({ open, client }: { open: boolean; client: any }) =>
    open ? <div data-testid="edit-client-dialog">Edit Modal for {client?.name}</div> : null,
}))

vi.mock("./delete-client-dialog", () => ({
  DeleteClientDialog: ({ open, client }: { open: boolean; client: any }) =>
    open ? <div data-testid="delete-client-dialog">Delete Modal for {client?.name}</div> : null,
}))

import { NuqsTestingAdapter } from "nuqs/adapters/testing"

function renderClientManager() {
  return render(
    <NuqsTestingAdapter>
      <ClientManager />
    </NuqsTestingAdapter>
  )
}

describe("ClientManager & Clients Page Components", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseQuery.mockReturnValue({
      data: [
        {
          id: "c-100",
          name: "Taraju Coffee",
          contact_email: "halo@taraju.com",
          channels: [{ id: "ch-1", platform: "instagram" }],
        },
      ],
    })
  })

  it("renders client card and Playbooks button", () => {
    renderClientManager()

    expect(screen.getByText("Taraju Coffee")).toBeDefined()
    expect(screen.getByText(/Kanal Terhubung/i)).toBeDefined()
    expect(screen.getByRole("button", { name: /Playbooks/i })).toBeDefined()
    expect(screen.getByRole("button", { name: /Brand Brain/i })).toBeDefined()
    expect(screen.getByRole("link", { name: /Portal Klien/i })).toBeDefined()
  })

  it("opens ClientPlaybooksDialog when Playbooks button is clicked", () => {
    renderClientManager()

    const playbooksBtn = screen.getByRole("button", { name: /Playbooks/i })
    fireEvent.click(playbooksBtn)

    expect(screen.getByTestId("playbooks-dialog")).toBeDefined()
    expect(screen.getByText("Playbooks Modal for Taraju Coffee")).toBeDefined()
  })

  it("opens BrandBrainEditorDialog when Brand Brain button is clicked", () => {
    renderClientManager()

    const brandBrainBtn = screen.getByRole("button", { name: /Brand Brain/i })
    fireEvent.click(brandBrainBtn)

    expect(screen.getByTestId("brand-brain-dialog")).toBeDefined()
    expect(screen.getByText("Brand Brain Modal for Taraju Coffee")).toBeDefined()
  })

  it("triggers openCreateClient when Add New Client dashed card is clicked", () => {
    renderClientManager()

    const addCardBtn = screen.getByRole("button", { name: /Add New Client/i })
    fireEvent.click(addCardBtn)

    expect(mockOpenCreateClient).toHaveBeenCalledTimes(1)
  })

  it("filters client cards in real-time when searching", () => {
    mockUseQuery.mockReturnValue({
      data: [
        { id: "c-1", name: "Taraju Coffee", contact_email: "halo@taraju.com", channels: [] },
        { id: "c-2", name: "Pawon Sengon", contact_email: "info@pawon.id", channels: [] },
      ],
    })
    renderClientManager()
    expect(screen.getByText("Taraju Coffee")).toBeDefined()
    expect(screen.getByText("Pawon Sengon")).toBeDefined()

    const searchInput = screen.getByPlaceholderText("Cari client...")
    fireEvent.change(searchInput, { target: { value: "Pawon" } })

    expect(screen.queryByText("Taraju Coffee")).toBeNull()
    expect(screen.getByText("Pawon Sengon")).toBeDefined()
  })

  it("renders ClientManagerSkeleton with accessibility role status", () => {
    render(<ClientManagerSkeleton />)

    const skeleton = screen.getByRole("status")
    expect(skeleton).toBeDefined()
    expect(skeleton.getAttribute("aria-label")).toBe("Memuat daftar client workspace")
  })

  it("renders AddClientHeaderButton and triggers openCreateClient on click", () => {
    render(<AddClientHeaderButton />)

    const headerBtn = screen.getByRole("button", { name: /Tambah Client/i })
    expect(headerBtn).toBeDefined()

    fireEvent.click(headerBtn)
    expect(mockOpenCreateClient).toHaveBeenCalledTimes(1)
  })

  it("renders SupportTicketsHeaderButton and opens tickets dialog on click", () => {
    mockUseAllSupportTickets.mockReturnValue({
      data: [
        { id: "t-1", status: "open" },
        { id: "t-2", status: "in_progress" },
        { id: "t-3", status: "resolved" },
      ],
    })

    render(<SupportTicketsHeaderButton />)

    const ticketsBtn = screen.getByRole("button", { name: /Tiket Dukungan/i })
    expect(ticketsBtn).toBeDefined()

    // Clicking it opens the dialog
    fireEvent.click(ticketsBtn)
    expect(screen.getByTestId("support-tickets-dialog")).toBeDefined()
  })

  it("opens EditClientDialog when Edit button is clicked", () => {
    renderClientManager()

    const editBtn = screen.getByRole("button", { name: /Edit Taraju Coffee/i })
    fireEvent.click(editBtn)

    expect(screen.getByTestId("edit-client-dialog")).toBeDefined()
    expect(screen.getByText("Edit Modal for Taraju Coffee")).toBeDefined()
  })

  it("opens DeleteClientDialog when Delete button is clicked", () => {
    renderClientManager()

    const deleteBtn = screen.getByRole("button", { name: /Hapus Taraju Coffee/i })
    fireEvent.click(deleteBtn)

    expect(screen.getByTestId("delete-client-dialog")).toBeDefined()
    expect(screen.getByText("Delete Modal for Taraju Coffee")).toBeDefined()
  })
})
