import * as React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { VisualPromptDialog } from "./visual-prompt-dialog"
import { renderWithProviders } from "@/test/render-with-providers"

const mockGenerateMutateAsync = vi.fn()
vi.mock("@/features/visual-prompt/api/queries", () => ({
  useGenerateVisualPrompt: () => ({
    mutateAsync: mockGenerateMutateAsync,
    isPending: false,
  }),
}))

describe("VisualPromptDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGenerateMutateAsync.mockResolvedValue({
      success: true,
      data: {
        title: "Visual Brief: Kopi Lereng Taraju",
        shouldGenerateAI: true,
        gateReasoning: "Cocok untuk AI Generative: Visual konseptual produk",
        recommendedTool: "flux",
        aspectRatio: "4:5",
        job: "hero_product",
        universalAnatomy: {
          subject: "Secangkir kopi Arabica Taraju mengepul di atas meja kayu",
          composition: "Rule of thirds composition, 35mm lens",
          lighting: "Warm morning directional sunlight",
          colorPalette: "Warm amber, deep espresso, cream",
          style: "Photorealistic lifestyle editorial shot",
          mood: "Calm, grounding, artisan",
          detail: "Fine steam rising, textured linen napkin",
          negativeConstraints: "No cartoon, no oversaturation",
        },
        toolSpecificPrompt:
          "Photorealistic editorial shot of Secangkir kopi Arabica Taraju for Taraju Coffee. Rule of thirds, warm sunlight, 35mm lens, f/2.8, aspect ratio 4:5.",
        negativePrompt: "render, plastic, airbrushed, cartoon, oversaturated",
        aiDisclosureTag: 'Dibuat dengan bantuan AI (Meta "Made with AI")',
        overlayTextGuidance: "Sisakan ruang kosong minimal 30% di sepertiga atas",
        copyableMarkdown: "# Visual Production Brief\n...",
      },
    })
  })

  it("renders dialog elements with inputs when open", () => {
    renderWithProviders(
      <VisualPromptDialog
        open={true}
        onOpenChange={vi.fn()}
        clientId="client-taraju"
        clientName="Taraju Coffee"
        initialTopic="Kenapa Kopi Lereng Taraju Punya Notes Floral Melati?"
        initialVisualBrief="Shot makro ceri kopi merah"
        initialFormat="Single"
      />
    )

    expect(screen.getByText("Studio Visual Prompter & Generator Media")).toBeDefined()
    expect(screen.getByDisplayValue("Kenapa Kopi Lereng Taraju Punya Notes Floral Melati?")).toBeDefined()
    expect(screen.getByDisplayValue("Shot makro ceri kopi merah")).toBeDefined()
    expect(screen.getByText("Rancang Prompt Visual Sesuai Upstream Spec")).toBeDefined()
  })

  it("submits the form and renders the generated visual prompt and gate badge", async () => {
    renderWithProviders(
      <VisualPromptDialog
        open={true}
        onOpenChange={vi.fn()}
        clientId="client-taraju"
        clientName="Taraju Coffee"
        initialTopic="Kopi Lereng Taraju"
      />
    )

    const generateBtn = screen.getByText("Rancang Prompt Visual Sesuai Upstream Spec")
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(mockGenerateMutateAsync).toHaveBeenCalledWith({
        clientId: "client-taraju",
        clientName: "Taraju Coffee",
        topic: "Kopi Lereng Taraju",
        visualBrief: undefined,
        tool: undefined,
        aspectRatio: "4:5",
        format: "Single",
      })
    })

    await waitFor(() => {
      expect(screen.getByText("Gate Step 0: Lolos Validasi AI")).toBeDefined()
      expect(screen.getByText("Mesin: FLUX")).toBeDefined()
      expect(screen.getByText("Rasio: 4:5")).toBeDefined()
      expect(screen.getByText(/Photorealistic editorial shot of Secangkir kopi Arabica Taraju/)).toBeDefined()
    })
  })

  it("switches to 8-elemen anatomi tab and displays breakdown", async () => {
    renderWithProviders(
      <VisualPromptDialog
        open={true}
        onOpenChange={vi.fn()}
        clientId="client-taraju"
        clientName="Taraju Coffee"
        initialTopic="Kopi Lereng Taraju"
      />
    )

    const generateBtn = screen.getByText("Rancang Prompt Visual Sesuai Upstream Spec")
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(screen.getByText("8 Elemen Anatomi")).toBeDefined()
    })

    const anatomyTabBtn = screen.getByText("8 Elemen Anatomi")
    fireEvent.click(anatomyTabBtn)

    expect(screen.getByText("1. Subject")).toBeDefined()
    expect(screen.getByText("2. Composition")).toBeDefined()
    expect(screen.getByText("3. Lighting")).toBeDefined()
    expect(screen.getByText("4. Color Palette")).toBeDefined()
  })
})
