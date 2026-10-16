import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import * as React from "react"
import { BrandBrainEditorDialog } from "./brand-brain-editor-dialog"
import { renderWithProviders } from "@/test/render-with-providers"

const mockUpsertMutateAsync = vi.fn()
const mockVerifyMutateAsync = vi.fn()
const mockDeleteMutateAsync = vi.fn()

vi.mock("react-markdown", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="markdown-preview">{children}</div>
  ),
}))

vi.mock("@/components/animate-ui/components/texts/metric-ticker", () => ({
  MetricTicker: ({ value }: { value: string | number }) => <span>{value}</span>,
}))

const MOCK_SERVER_FILES = [
  {
    client_id: "c-1",
    path: "brand-profile.md",
    content: "# Brand Profile\nTaraju Teh Organik",
    updated_at: new Date().toISOString(),
    needs_verification: false,
  },
  {
    client_id: "c-1",
    path: "guardrails.md",
    content: "Dilarang politik (verify-quarterly)",
    updated_at: new Date().toISOString(),
    needs_verification: true,
  },
]

vi.mock("@/features/brand-files/api/queries", () => ({
  useClientFiles: vi.fn(() => ({
    data: MOCK_SERVER_FILES,
    isLoading: false,
  })),
  useUpsertClientFile: vi.fn(() => ({
    mutateAsync: mockUpsertMutateAsync,
    isPending: false,
  })),
  useVerifyClientFile: vi.fn(() => ({
    mutateAsync: mockVerifyMutateAsync,
    isPending: false,
  })),
  useDeleteClientFile: vi.fn(() => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  })),
}))

function renderDialog(props: Partial<React.ComponentProps<typeof BrandBrainEditorDialog>> = {}) {
  return renderWithProviders(
    <BrandBrainEditorDialog
      open={true}
      onOpenChange={vi.fn()}
      clientId="c-1"
      clientName="Taraju"
      {...props}
    />
  )
}

describe("BrandBrainEditorDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders dialog header, file tabs, and current content", () => {
    renderDialog()

    expect(
      screen.getByText(/Brand Brain Markdown Studio — Taraju/i)
    ).toBeInTheDocument()
    expect(screen.getByText("Brand Profile")).toBeInTheDocument()
    expect(screen.getByText("Voice & Tone")).toBeInTheDocument()
    expect(screen.getByText("Content Pillars")).toBeInTheDocument()
    expect(screen.getByText("Guardrails & Never-List")).toBeInTheDocument()

    // Editor textarea should contain current brand-profile.md content
    const textarea = screen.getByPlaceholderText(
      /Mulai tulis dokumen brand-profile.md di sini/i
    )
    expect(textarea).toHaveValue("# Brand Profile\nTaraju Teh Organik")
  })

  it("switches tabs when clicking Voice & Tone", () => {
    renderDialog()

    const voiceTab = screen.getByText("Voice & Tone")
    fireEvent.click(voiceTab)

    expect(screen.getByText(/Brand Voice & Tone Guide/i)).toBeInTheDocument()
    const textarea = screen.getByPlaceholderText(
      /Mulai tulis dokumen voice.md di sini/i
    )
    expect(textarea).toBeInTheDocument()
  })

  it("applies standard template when clicking 'Template Standar' or 'Gunakan Template Baku'", () => {
    renderDialog({ initialPath: "content-pillars.md" })

    // Find template button
    const templateBtn = screen.getByText("Gunakan Template Baku")
    fireEvent.click(templateBtn)

    const textarea = screen.getByPlaceholderText(
      /Mulai tulis dokumen content-pillars.md di sini/i
    )
    expect(textarea).toBeInTheDocument()
    expect((textarea as HTMLTextAreaElement).value).toContain("# Content Pillars & Focus Areas")
  })

  it("switches to Live Prompt Context view mode", () => {
    renderDialog()

    const compiledBtn = screen.getByText("Live Prompt Context")
    fireEvent.click(compiledBtn)

    expect(
      screen.getByText(/Konteks Final yang Diterima AI Copilot/i)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Inilah naskah utuh yang disuntikkan secara otomatis/i)
    ).toBeInTheDocument()
  })

  it("calls upsert mutation when clicking Simpan", async () => {
    mockUpsertMutateAsync.mockResolvedValue({})
    renderDialog()

    const saveBtn = screen.getByText("Simpan Brand Profile")
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockUpsertMutateAsync).toHaveBeenCalledWith({
        clientId: "c-1",
        path: "brand-profile.md",
        content: "# Brand Profile\nTaraju Teh Organik",
      })
    })
  })

  it("opens Audit DNA report banner when clicking Audit DNA button", async () => {
    renderDialog()

    const auditBtn = screen.getByRole("button", { name: /Audit DNA/i })
    expect(auditBtn).toBeInTheDocument()
    fireEvent.click(auditBtn)

    expect(await screen.findByText(/Kesiapan Brand DNA untuk AI Copilot/i)).toBeInTheDocument()
  })

  it("shows Hapus Dokumen button for non-core file that exists on server and calls deleteFile", async () => {
    mockDeleteMutateAsync.mockResolvedValue(undefined)
    renderDialog({ initialPath: "guardrails.md" })

    const deleteBtn = screen.getByRole("button", { name: /Hapus Dokumen/i })
    expect(deleteBtn).toBeInTheDocument()
    fireEvent.click(deleteBtn)

    // AlertDialog opens with confirmation
    expect(screen.getByText(/Hapus Dokumen Guardrails & Never-List\?/i)).toBeInTheDocument()

    // Click confirm in the AlertDialog
    const confirmBtn = screen.getByRole("button", { name: "Hapus Dokumen" })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith({
        clientId: "c-1",
        path: "guardrails.md",
      })
    })
  })

  it("does not show Hapus Dokumen button for core brand-profile.md file", () => {
    renderDialog({ initialPath: "brand-profile.md" })
    expect(screen.queryByRole("button", { name: /Hapus Dokumen/i })).toBeNull()
  })
})
