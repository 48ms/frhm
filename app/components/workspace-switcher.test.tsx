import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { WorkspaceSwitcher } from "./workspace-switcher"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const mockOpenCreateClient = vi.fn()
const mockSetClientId = vi.fn()
const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock("@/components/client/create-client-provider", () => ({
  useCreateClient: () => ({
    openCreateClient: mockOpenCreateClient,
    closeCreateClient: vi.fn(),
  }),
}))

vi.mock("@/components/dashboard-stitch/dashboard-data", () => ({
  useActiveDashboard: () => ({
    clientId: "client-1",
    setClientId: mockSetClientId,
    clients: [
      { id: "client-1", name: "Taraju", channels: [{ id: "ch-1" }, { id: "ch-2" }] },
      { id: "client-2", name: "Pawon Sengon", channels: [{ id: "ch-3" }] },
    ],
  }),
}))

describe("WorkspaceSwitcher", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  function renderComponent(props: { collapsed?: boolean } = {}) {
    return render(
      <QueryClientProvider client={queryClient}>
        <WorkspaceSwitcher {...props} />
      </QueryClientProvider>
    )
  }

  it("renders active workspace name and initial in expanded mode", () => {
    renderComponent({ collapsed: false })
    expect(screen.getByText("Taraju")).toBeInTheDocument()
    expect(screen.getByText("Workspace")).toBeInTheDocument()
    expect(screen.getByText("T")).toBeInTheDocument()
  })

  it("renders compact trigger in collapsed mode", () => {
    renderComponent({ collapsed: true })
    const trigger = screen.getByRole("button", { name: /Current workspace: Taraju/i })
    expect(trigger).toBeInTheDocument()
    expect(trigger).toHaveTextContent("T")
  })

  it("opens dropdown and displays workspaces, channel count, and Tambah Client Baru button", async () => {
    renderComponent({ collapsed: false })
    const trigger = screen.getByRole("button", { name: /Current workspace: Taraju/i })
    fireEvent.pointerDown(trigger, { button: 0 })
    fireEvent.keyDown(trigger, { key: "Enter" })

    await waitFor(() => {
      expect(screen.getByText("Switch Workspace")).toBeInTheDocument()
      expect(screen.getByText("Pawon Sengon")).toBeInTheDocument()
      expect(screen.getByText("Tambah Client Baru")).toBeInTheDocument()
      expect(screen.getByText("Semua Client")).toBeInTheDocument()
    })
  })

  it("invokes openCreateClient when Tambah Client Baru is clicked", async () => {
    renderComponent({ collapsed: false })
    const trigger = screen.getByRole("button", { name: /Current workspace: Taraju/i })
    fireEvent.pointerDown(trigger, { button: 0 })
    fireEvent.keyDown(trigger, { key: "Enter" })

    await waitFor(() => {
      expect(screen.getByText("Tambah Client Baru")).toBeInTheDocument()
    })

    const addClientItem = screen.getByText("Tambah Client Baru")
    fireEvent.click(addClientItem)

    expect(mockOpenCreateClient).toHaveBeenCalledTimes(1)
  })

  it("invokes setClientId when another workspace is selected", async () => {
    renderComponent({ collapsed: false })
    const trigger = screen.getByRole("button", { name: /Current workspace: Taraju/i })
    fireEvent.pointerDown(trigger, { button: 0 })
    fireEvent.keyDown(trigger, { key: "Enter" })

    await waitFor(() => {
      expect(screen.getByText("Pawon Sengon")).toBeInTheDocument()
    })

    const secondClientItem = screen.getByText("Pawon Sengon")
    fireEvent.click(secondClientItem)

    expect(mockSetClientId).toHaveBeenCalledWith("client-2")
  })

  it("navigates to /admin/clients when Semua Client is clicked", async () => {
    renderComponent({ collapsed: false })
    const trigger = screen.getByRole("button", { name: /Current workspace: Taraju/i })
    fireEvent.pointerDown(trigger, { button: 0 })
    fireEvent.keyDown(trigger, { key: "Enter" })

    await waitFor(() => {
      expect(screen.getByText("Semua Client")).toBeInTheDocument()
    })

    const allClientsItem = screen.getByText("Semua Client")
    fireEvent.click(allClientsItem)

    expect(mockPush).toHaveBeenCalledWith("/admin/clients")
  })
})

