import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ClientPlaybooksDialog } from "./client-playbooks-dialog"

const mockUseClientSkills = vi.fn()
const mockUseSkillPacks = vi.fn()
const mockUseClientSkillOutputs = vi.fn()
const mockUseAssignPackToClient = vi.fn()
const mockPromoteMutate = vi.fn()
const mockUpdateStatusMutate = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/features/skills/api/queries", () => ({
  useClientSkills: (...args: unknown[]) => mockUseClientSkills(...args),
  useSkillPacks: (...args: unknown[]) => mockUseSkillPacks(...args),
  useClientSkillOutputs: (...args: unknown[]) => mockUseClientSkillOutputs(...args),
  useAssignPackToClient: (...args: unknown[]) => mockUseAssignPackToClient(...args),
  useSkillChatTurn: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useSaveSkillOutput: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useExecuteSkillTool: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useExecuteGenericSkill: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}))

vi.mock("@/features/deliverables/api/queries", () => ({
  usePromoteSkillOutputToDeliverable: () => ({
    mutate: mockPromoteMutate,
    isPending: false,
  }),
  useUpdateDeliverableStatus: () => ({
    mutate: mockUpdateStatusMutate,
    isPending: false,
  }),
  useScheduleApprovedDeliverable: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

describe("ClientPlaybooksDialog Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseClientSkills.mockReturnValue({
      data: [
        {
          id: "cs-1",
          client_id: "c-100",
          skill_id: "hook-writer",
          status: "selesai",
          notes: null,
          skill: {
            id: "hook-writer",
            name: "Hook Writer",
            category: "Copy & captions",
            job: "Writes 5 hook archetypes",
            description: "Writes 5 hook archetypes",
            allowed_tools: null,
          },
        },
      ],
      isLoading: false,
    })

    mockUseSkillPacks.mockReturnValue({
      data: [
        {
          id: "instagram-growth",
          name: "Instagram & Reels Growth",
          category: "Growth",
          description: "Dominasi Reels dan Carousel",
          skill_count: 10,
        },
      ],
      isLoading: false,
    })

    mockUseClientSkillOutputs.mockReturnValue({
      data: [
        {
          id: "out-1",
          client_id: "c-100",
          skill_id: "competitor-analysis",
          title: "Analisis Kompetitor Taraju",
          content: "### Analisis Hasil",
          status: "draft",
          deliverable_id: null,
          created_at: "2026-10-14T10:00:00Z",
        },
      ],
      isLoading: false,
    })

    mockUseAssignPackToClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })
  })

  it("renders modal header with client name and all three tabs", () => {
    render(
      <ClientPlaybooksDialog
        open={true}
        onOpenChange={vi.fn()}
        clientId="c-100"
        clientName="Taraju Coffee"
      />
    )

    expect(screen.getByText(/Strategi & Playbooks — Taraju Coffee/i)).toBeDefined()
    expect(screen.getByText(/Playbook Aktif \(1\)/i)).toBeDefined()
    expect(screen.getByText(/Tugaskan Paket \(17\)/i)).toBeDefined()
    expect(screen.getByText(/Riwayat Dokumen \(1\)/i)).toBeDefined()
  })

  it("displays assigned playbook with status and re-run button", () => {
    render(
      <ClientPlaybooksDialog
        open={true}
        onOpenChange={vi.fn()}
        clientId="c-100"
        clientName="Taraju Coffee"
      />
    )

    expect(screen.getByText("Hook Writer")).toBeDefined()
    expect(screen.getByText("Selesai")).toBeDefined()
    expect(screen.getByText(/Jalankan Ulang/i)).toBeDefined()
  })

  it("switches to outputs history tab, shows document title, and promotes to deliverable", () => {
    render(
      <ClientPlaybooksDialog
        open={true}
        onOpenChange={vi.fn()}
        clientId="c-100"
        clientName="Taraju Coffee"
      />
    )

    const outputsTab = screen.getByText(/Riwayat Dokumen \(1\)/i)
    fireEvent.click(outputsTab)

    expect(screen.getByText("Analisis Kompetitor Taraju")).toBeDefined()
    expect(screen.getByText("competitor-analysis")).toBeDefined()
    expect(screen.getByText("Draf Internal")).toBeDefined()

    const sendBtn = screen.getByRole("button", { name: /Kirim ke Client/i })
    fireEvent.click(sendBtn)

    expect(mockPromoteMutate).toHaveBeenCalledWith({
      outputId: "out-1",
      clientId: "c-100",
    })
  })

  it("shows deliverable status and review actions when document is promoted", () => {
    mockUseClientSkillOutputs.mockReturnValue({
      data: [
        {
          id: "out-2",
          client_id: "c-100",
          skill_id: "hook-writer",
          title: "Viral Hooks Taraju Q4",
          content: "### Viral Hooks",
          status: "sent",
          deliverable_id: "deliv-999",
          created_at: "2026-10-14T10:00:00Z",
        },
      ],
      isLoading: false,
    })

    render(
      <ClientPlaybooksDialog
        open={true}
        onOpenChange={vi.fn()}
        clientId="c-100"
        clientName="Taraju Coffee"
      />
    )

    const outputsTab = screen.getByText(/Riwayat Dokumen \(1\)/i)
    fireEvent.click(outputsTab)

    expect(screen.getByText("Viral Hooks Taraju Q4")).toBeDefined()
    expect(screen.getByText("Terkirim")).toBeDefined()

    const approveBtn = screen.getByRole("button", { name: /Setujui/i })
    fireEvent.click(approveBtn)

    expect(mockUpdateStatusMutate).toHaveBeenCalledWith({
      deliverableId: "deliv-999",
      clientId: "c-100",
      status: "approved",
    })
  })
})
