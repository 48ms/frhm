import React from "react"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AiProvidersTab } from "./ai-providers-tab"
import { renderWithProviders } from "@/test/render-with-providers"

const mockUseAiProviders = vi.fn()
const mockCreateAiProvider = vi.fn()
const mockUpdateAiProvider = vi.fn()
const mockDeleteAiProvider = vi.fn()
const mockSetDefaultAiProvider = vi.fn()
const mockTestAiProvider = vi.fn()

vi.mock("@/features/ai-providers/api/queries", () => ({
  useAiProviders: () => mockUseAiProviders(),
  useCreateAiProvider: () => ({
    mutateAsync: mockCreateAiProvider,
    isPending: false,
  }),
  useUpdateAiProvider: () => ({
    mutateAsync: mockUpdateAiProvider,
    isPending: false,
  }),
  useDeleteAiProvider: () => ({
    mutateAsync: mockDeleteAiProvider,
    isPending: false,
  }),
  useSetDefaultAiProvider: () => ({
    mutateAsync: mockSetDefaultAiProvider,
    isPending: false,
  }),
  useTestAiProvider: () => ({
    mutateAsync: mockTestAiProvider,
    isPending: false,
  }),
}))

describe("AiProvidersTab", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders empty state when no providers are configured", () => {
    mockUseAiProviders.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    })

    renderWithProviders(<AiProvidersTab />)

    expect(screen.getByText(/AI Model & Provider Endpoints/i)).toBeInTheDocument()
    expect(screen.getByText(/Belum ada AI Provider tersimpan/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Buat Provider Pertama/i })).toBeInTheDocument()
  })

  it("renders list of configured providers with masked keys and badges", () => {
    mockUseAiProviders.mockReturnValue({
      data: [
        {
          id: "p1",
          label: "Google Gemini Flash",
          kind: "gemini",
          model: "gemini-2.0-flash",
          base_url: null,
          is_default: true,
          created_at: new Date().toISOString(),
          has_key: true,
          masked_key: "••••••••1234",
        },
        {
          id: "p2",
          label: "Claude 3.5 Sonnet",
          kind: "anthropic",
          model: "claude-3-5-sonnet-20241022",
          base_url: null,
          is_default: false,
          created_at: new Date().toISOString(),
          has_key: true,
          masked_key: "••••••••5678",
        },
      ],
      isLoading: false,
      isError: false,
    })

    renderWithProviders(<AiProvidersTab />)

    expect(screen.getByText("Google Gemini Flash")).toBeInTheDocument()
    expect(screen.getByText("Claude 3.5 Sonnet")).toBeInTheDocument()
    expect(screen.getByText("••••••••1234")).toBeInTheDocument()
    expect(screen.getByText("Default Active")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Jadikan Default/i })).toBeInTheDocument()
  })

  it("opens create provider dialog when clicking 'Tambah Provider'", () => {
    mockUseAiProviders.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    })

    renderWithProviders(<AiProvidersTab />)

    const addBtn = screen.getByRole("button", { name: /Tambah Provider/i })
    fireEvent.click(addBtn)

    expect(screen.getByText(/Tambah AI Provider Baru/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Contoh: Gemini 2.0 Flash Production/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Tambahkan Provider/i })).toBeInTheDocument()
  })
})
