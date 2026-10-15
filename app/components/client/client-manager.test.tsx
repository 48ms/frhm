import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ClientManager } from "./client-manager"

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

describe("ClientManager Component", () => {
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
      isLoading: false,
    })
  })

  it("renders client card and Playbooks button", () => {
    render(<ClientManager />)

    expect(screen.getByText("Taraju Coffee")).toBeDefined()
    expect(screen.getByText("1 Kanal Terhubung")).toBeDefined()
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
})
