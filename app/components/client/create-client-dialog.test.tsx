import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { CreateClientWizard } from "./create-client-dialog"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const mockPush = vi.fn()
const mockSetClientId = vi.fn()
const mockCreateNewClient = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock("nuqs", () => ({
  useQueryState: () => ["", mockSetClientId],
  parseAsString: { withDefault: (d: string) => d },
}))

vi.mock("@/features/dashboard/api/service", () => ({
  createNewClient: (...args: any[]) => mockCreateNewClient(...args),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe("CreateClientWizard", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    mockCreateNewClient.mockResolvedValue({
      id: "new-client-uuid",
      name: "Warung Kopi Nusantara",
      seededSkills: 5,
    })
  })

  function renderDialog(open = true, onOpenChange = vi.fn()) {
    return render(
      <QueryClientProvider client={queryClient}>
        <CreateClientWizard open={open} onOpenChange={onOpenChange} />
      </QueryClientProvider>
    )
  }

  it("renders step 1 with Brand Name and Niche selector when open", () => {
    renderDialog(true)

    expect(screen.getByText(/Tambah Client Baru/i)).toBeInTheDocument()
    expect(screen.getByText(/Langkah 1 dari 2/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Nama Brand/i)).toBeInTheDocument()
    expect(screen.getByText(/Niche \/ Industri/i)).toBeInTheDocument()
  })

  it("shows error when trying to advance with empty fields", async () => {
    renderDialog(true)

    const nextBtn = screen.getByRole("button", { name: /Lanjut ke Kontak/i })
    fireEvent.click(nextBtn)

    await waitFor(() => {
      expect(screen.getByText(/Mohon lengkapi Nama Brand dan Niche terlebih dahulu/i)).toBeInTheDocument()
    })
  })

  it("advances to step 2 when Brand Name and Niche are provided", async () => {
    renderDialog(true)

    const nameInput = screen.getByLabelText(/Nama Brand/i)
    fireEvent.change(nameInput, { target: { value: "Warung Kopi Nusantara" } })

    // Select niche
    const combobox = screen.getByRole("combobox")
    fireEvent.click(combobox)

    const fnbOption = screen.getByRole("option", { name: /F&B \/ Kuliner/i })
    fireEvent.click(fnbOption)

    const nextBtn = screen.getByRole("button", { name: /Lanjut ke Kontak/i })
    fireEvent.click(nextBtn)

    await waitFor(() => {
      expect(screen.getByText(/Langkah 2 dari 2/i)).toBeInTheDocument()
      expect(screen.getByText(/Detail Kontak & Akses Client/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Siapkan Workspace/i })).toBeInTheDocument()
    })
  })

  it("submits form, calls createNewClient, auto-switches active clientId, and displays success launchpad", async () => {
    renderDialog(true)

    // Step 1
    fireEvent.change(screen.getByLabelText(/Nama Brand/i), { target: { value: "Warung Kopi Nusantara" } })
    fireEvent.click(screen.getByRole("combobox"))
    fireEvent.click(screen.getByRole("option", { name: /F&B \/ Kuliner/i }))
    fireEvent.click(screen.getByRole("button", { name: /Lanjut ke Kontak/i }))

    await waitFor(() => {
      expect(screen.getByText(/Langkah 2 dari 2/i)).toBeInTheDocument()
    })

    // Step 2
    fireEvent.change(screen.getByLabelText(/Email Login Portal/i), { target: { value: "owner@warkop.id" } })
    fireEvent.change(screen.getByLabelText(/No. WhatsApp/i), { target: { value: "08123456789" } })

    const submitBtn = screen.getByRole("button", { name: /Siapkan Workspace/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockCreateNewClient).toHaveBeenCalledWith({
        name: "Warung Kopi Nusantara",
        niche: "fnb",
        contact_email: "owner@warkop.id",
        contact_phone: "08123456789",
        telegram_chat_id: undefined,
      })
    })

    // Should switch active clientId
    expect(mockSetClientId).toHaveBeenCalledWith("new-client-uuid")

    // Success dialog launchpad
    await waitFor(() => {
      expect(screen.getByText(/Workspace Client Siap!/i)).toBeInTheDocument()
      expect(screen.getByText(/5 Skill Siap/i)).toBeInTheDocument()
    })

    // Mulai interview button should navigate to AI Studio brand-brain
    const interviewBtn = screen.getByRole("button", { name: /Mulai Interview Brand Profile/i })
    fireEvent.click(interviewBtn)
    expect(mockPush).toHaveBeenCalledWith("/admin/ai?tab=brand-brain&clientId=new-client-uuid")
  })

  it("navigates to dashboard when Lanjut ke Dashboard Dulu is clicked on success screen", async () => {
    renderDialog(true)

    // Step 1
    fireEvent.change(screen.getByLabelText(/Nama Brand/i), { target: { value: "Warung Kopi Nusantara" } })
    fireEvent.click(screen.getByRole("combobox"))
    fireEvent.click(screen.getByRole("option", { name: /F&B \/ Kuliner/i }))
    fireEvent.click(screen.getByRole("button", { name: /Lanjut ke Kontak/i }))

    await waitFor(() => {
      expect(screen.getByText(/Langkah 2 dari 2/i)).toBeInTheDocument()
    })

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /Siapkan Workspace/i }))

    await waitFor(() => {
      expect(screen.getByText(/Workspace Client Siap!/i)).toBeInTheDocument()
    })

    const dashboardBtn = screen.getByRole("button", { name: /Lanjut ke Dashboard Dulu/i })
    fireEvent.click(dashboardBtn)
    expect(mockPush).toHaveBeenCalledWith("/admin/dashboard?clientId=new-client-uuid")
  })

  it("navigates to playbooks tab when Buka Playbook Studio is clicked on success screen", async () => {
    renderDialog(true)

    // Step 1
    fireEvent.change(screen.getByLabelText(/Nama Brand/i), { target: { value: "Warung Kopi Nusantara" } })
    fireEvent.click(screen.getByRole("combobox"))
    fireEvent.click(screen.getByRole("option", { name: /F&B \/ Kuliner/i }))
    fireEvent.click(screen.getByRole("button", { name: /Lanjut ke Kontak/i }))

    await waitFor(() => {
      expect(screen.getByText(/Langkah 2 dari 2/i)).toBeInTheDocument()
    })

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /Siapkan Workspace/i }))

    await waitFor(() => {
      expect(screen.getByText(/Workspace Client Siap!/i)).toBeInTheDocument()
    })

    const playbooksBtn = screen.getByRole("button", { name: /Buka Playbook Studio/i })
    fireEvent.click(playbooksBtn)
    expect(mockPush).toHaveBeenCalledWith("/admin/ai?tab=playbooks&clientId=new-client-uuid")
  })
})

