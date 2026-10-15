import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SkillInterviewModal } from "./skill-interview-modal"

const mockMutateChat = vi.fn()
const mockMutateSave = vi.fn()
const mockMutateMcp = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/features/skills/api/queries", () => ({
  useSkillChatTurn: () => ({
    mutate: mockMutateChat,
    isPending: false,
  }),
  useSaveSkillOutput: () => ({
    mutate: mockMutateSave,
    isPending: false,
  }),
  useExecuteSkillTool: () => ({
    mutate: mockMutateMcp,
    isPending: false,
  }),
}))

describe("SkillInterviewModal Component", () => {
  const fakeSkill = {
    id: "competitor-analysis",
    name: "Competitor Analysis",
    description: "Riset kompetitor utama dan cari celah konten",
    category: "Foundation & strategy",
    job: "Riset kompetitor utama dan cari celah konten",
    allowed_tools: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("triggers auto-start greeting when opened", () => {
    render(
      <SkillInterviewModal
        open={true}
        onOpenChange={vi.fn()}
        skill={fakeSkill}
        clientId="c-100"
        clientName="Taraju Coffee"
      />
    )

    expect(screen.getByText("Competitor Analysis")).toBeDefined()
    expect(mockMutateChat).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "c-100",
        skillId: "competitor-analysis",
        messages: [],
      }),
      expect.any(Object)
    )
  })

  it("shows 'Menunggu Dokumen' initially when no preview exists", () => {
    render(
      <SkillInterviewModal
        open={true}
        onOpenChange={vi.fn()}
        skill={fakeSkill}
        clientId="c-100"
        clientName="Taraju Coffee"
      />
    )

    expect(screen.getByText("Menunggu Dokumen")).toBeDefined()
    // Button "Finalisasi & Simpan" must NOT be visible when not done (OpenSpec requirement)
    expect(screen.queryByText(/Finalisasi & Simpan/i)).toBeNull()
  })

  it("renders live draft preview with badge 'Draf Langsung' when preview is received", () => {
    mockMutateChat.mockImplementation(({}, { onSuccess }) => {
      onSuccess({
        reply: "Halo, siapa kompetitor Anda?",
        done: false,
        preview: {
          title: "Draf Riset Kompetitor",
          content: "### Analisis Awal\n- Kompetitor A: Toko Kopi Tuku",
        },
      })
    })

    render(
      <SkillInterviewModal
        open={true}
        onOpenChange={vi.fn()}
        skill={fakeSkill}
        clientId="c-100"
        clientName="Taraju Coffee"
      />
    )

    expect(screen.getByText("Draf Langsung")).toBeDefined()
    expect(screen.getAllByText("Draf Riset Kompetitor").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Kompetitor A: Toko Kopi Tuku/)).toBeDefined()
    // OpenSpec requirement: partial draft MUST NOT have Finalisasi button
    expect(screen.queryByText(/Finalisasi & Simpan/i)).toBeNull()
  })

  it("shows 'Finalisasi & Simpan' button only when done is true", () => {
    mockMutateChat.mockImplementation(({}, { onSuccess }) => {
      onSuccess({
        reply: "Riset selesai! Dokumen sudah lengkap.",
        done: true,
        output: {
          title: "Hasil Riset Final",
          content: "### Dokumen Lengkap\nSemua kompetitor terpetakan.",
        },
      })
    })

    render(
      <SkillInterviewModal
        open={true}
        onOpenChange={vi.fn()}
        skill={fakeSkill}
        clientId="c-100"
        clientName="Taraju Coffee"
      />
    )

    expect(screen.getByText(/Finalisasi & Simpan/i)).toBeDefined()
    expect(screen.getByText("Lengkap")).toBeDefined()

    // Clicking save triggers saveMutation
    fireEvent.click(screen.getByText(/Finalisasi & Simpan/i))
    expect(mockMutateSave).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "c-100",
        skillId: "competitor-analysis",
        title: "Hasil Riset Final",
        content: "### Dokumen Lengkap\nSemua kompetitor terpetakan.",
      }),
      expect.any(Object)
    )
  })

  it("renders WoopSocial MCP badge and handles Cek Akun MCP button click", () => {
    const mcpSkill = {
      id: "scheduling-and-queue",
      name: "Scheduling & Queue",
      description: "Jadwalkan postingan ke media sosial via MCP",
      category: "Publishing & schedule",
      job: "Kelola antrean dan jadwal",
      allowed_tools: "WoopSocial MCP (Projects, Social Accounts, Posts)",
    }

    render(
      <SkillInterviewModal
        open={true}
        onOpenChange={vi.fn()}
        skill={mcpSkill}
        clientId="c-100"
        clientName="Taraju Coffee"
      />
    )

    expect(screen.getByText("WoopSocial MCP")).toBeDefined()
    expect(screen.getByText("Cek Akun MCP")).toBeDefined()

    fireEvent.click(screen.getByText("Cek Akun MCP"))
    expect(mockMutateMcp).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "c-100",
        skillId: "scheduling-and-queue",
        toolName: "woopsocial_list_social_accounts",
      }),
      expect.any(Object)
    )
  })
})
