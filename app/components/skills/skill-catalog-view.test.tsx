import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SkillCatalogView } from "./skill-catalog-view"

const mockUseSkills = vi.fn()
const mockUseSkillPacks = vi.fn()
const mockUseClientSkills = vi.fn()
const mockUseAssignPackToClient = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock("@/features/skills/api/queries", () => ({
  useSkills: (...args: unknown[]) => mockUseSkills(...args),
  useSkillPacks: (...args: unknown[]) => mockUseSkillPacks(...args),
  useClientSkills: (...args: unknown[]) => mockUseClientSkills(...args),
  useAssignPackToClient: (...args: unknown[]) => mockUseAssignPackToClient(...args),
  useSkillChatTurn: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useSaveSkillOutput: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useExecuteSkillTool: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}))

vi.mock("nuqs", () => ({
  useQueryState: (key: string, parser: any) => {
    return ["all", vi.fn()]
  },
  parseAsString: {
    withDefault: (val: string) => ({ default: val }),
  },
}))

describe("SkillCatalogView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSkills.mockReturnValue({
      data: [
        {
          id: "hook-writer",
          name: "Hook Writer",
          description: "Writes 5 hook archetypes",
          category: "Copy & captions",
          job: "Writes 5 hook archetypes",
          allowed_tools: null,
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
          skills: [],
        },
      ],
      isLoading: false,
    })
    mockUseClientSkills.mockReturnValue({
      data: [{ skill_id: "hook-writer", status: "selesai" }],
    })
    mockUseAssignPackToClient.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })
  })

  it("renders 17 Topic Packs view by default", () => {
    render(<SkillCatalogView clientId="c-1" clientName="Taraju Coffee" />)

    expect(screen.getByText("Paket Solusi Strategis (Topic Packs)")).toBeDefined()
    expect(screen.getByText("Instagram & Reels Growth")).toBeDefined()
    expect(screen.getByText("10 Playbook")).toBeDefined()
  })

  it("switches to All Skills view when clicking toggle", () => {
    render(<SkillCatalogView clientId="c-1" clientName="Taraju Coffee" />)

    const allSkillsBtn = screen.getByText("Semua 106 Playbook")
    fireEvent.click(allSkillsBtn)

    expect(screen.getByText("Hook Writer")).toBeDefined()
    expect(screen.getByText("Writes 5 hook archetypes")).toBeDefined()
    expect(screen.getByText("Selesai")).toBeDefined()
  })
})
