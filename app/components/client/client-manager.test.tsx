import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import {
  ClientManager,
  ClientManagerSkeleton,
  AddClientHeaderButton,
} from "./client-manager"

const mockUseQuery = vi.fn()
const mockOpenCreateClient = vi.fn()

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

vi.mock("./client-playbooks-dialog", () => ({
  ClientPlaybooksDialog: ({ open, clientName }: { open: boolean; clientName: string }) =>
    open ? <div data-testid="playbooks-dialog">Playbooks Modal for {clientName}</div> : null,
}))

vi.mock("@/components/ai/brand-brain-editor-dialog", () => ({
  BrandBrainEditorDialog: ({ open, clientName }: { open: boolean; clientName: string }) =>
    open ? <div data-testid="brand-brain-dialog">Brand Brain Modal for {clientName}</div> : null,
}))

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
    render(<ClientManager />)

    expect(screen.getByText("Taraju Coffee")).toBeDefined()
    expect(screen.getByText(/Kanal Terhubung/i)).toBeDefined()
    expect(screen.getByRole("button", { name: /Playbooks/i })).toBeDefined()
    expect(screen.getByRole("button", { name: /Brand Brain/i })).toBeDefined()
  })

  it("opens ClientPlaybooksDialog when Playbooks button is clicked", () => {
    render(<ClientManager />)

    const playbooksBtn = screen.getByRole("button", { name: /Playbooks/i })
    fireEvent.click(playbooksBtn)

    expect(screen.getByTestId("playbooks-dialog")).toBeDefined()
    expect(screen.getByText("Playbooks Modal for Taraju Coffee")).toBeDefined()
  })

  it("opens BrandBrainEditorDialog when Brand Brain button is clicked", () => {
    render(<ClientManager />)

    const brandBrainBtn = screen.getByRole("button", { name: /Brand Brain/i })
    fireEvent.click(brandBrainBtn)

    expect(screen.getByTestId("brand-brain-dialog")).toBeDefined()
    expect(screen.getByText("Brand Brain Modal for Taraju Coffee")).toBeDefined()
  })

  it("triggers openCreateClient when Add New Client dashed card is clicked", () => {
    render(<ClientManager />)

    const addCardBtn = screen.getByRole("button", { name: /Add New Client/i })
    fireEvent.click(addCardBtn)

    expect(mockOpenCreateClient).toHaveBeenCalledTimes(1)
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
})
