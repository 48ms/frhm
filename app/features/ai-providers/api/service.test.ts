import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getAiProviders,
  createAiProvider,
  updateAiProvider,
  deleteAiProvider,
  setDefaultAiProvider,
} from "./service"
import { logAudit } from "@/lib/audit/log"

const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockOrder = vi.fn()
const mockEq = vi.fn()
const mockNeq = vi.fn()
const mockSingle = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { role: "admin" }, error: null }),
        }),
      }),
    }),
  }),
}))

vi.mock("@/lib/supabase/service", () => ({
  createSupabaseServiceClient: vi.fn().mockReturnValue({
    from: (table: string) => ({
      select: (...args: unknown[]) => mockSelect(...args),
      insert: (...args: unknown[]) => mockInsert(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
    }),
  }),
}))

vi.mock("@/lib/audit/log", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

describe("AI Providers Service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: "admin-user-1" } } })
  })

  it("fetches AI providers and masks API keys securely", async () => {
    mockSelect.mockReturnValue({
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: "11111111-1111-1111-1111-111111111111",
            label: "Gemini 2.0 Flash",
            kind: "gemini",
            model: "gemini-2.0-flash",
            base_url: null,
            api_key: "AIzaSySecretKey123456",
            is_default: true,
            created_at: new Date().toISOString(),
          },
        ],
        error: null,
      }),
    })

    const providers = await getAiProviders()
    expect(providers).toHaveLength(1)
    expect(providers[0].label).toBe("Gemini 2.0 Flash")
    expect(providers[0].has_key).toBe(true)
    expect(providers[0].masked_key).toContain("••••••••")
    expect(providers[0].masked_key).toContain("3456")
    // Ensure raw key is never returned
    expect((providers[0] as any).api_key).toBeUndefined()
  })

  it("creates a new AI provider and respects default unsetting", async () => {
    mockUpdate.mockReturnValue({
      neq: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    mockInsert.mockReturnValue({
      select: () => ({
        single: () =>
          Promise.resolve({
            data: {
              id: "22222222-2222-2222-2222-222222222222",
              label: "Claude 3.5 Sonnet",
              kind: "anthropic",
              model: "claude-3-5-sonnet-20241022",
              base_url: null,
              api_key: "sk-ant-secret1234",
              is_default: true,
              created_at: new Date().toISOString(),
            },
            error: null,
          }),
      }),
    })

    const created = await createAiProvider({
      label: "Claude 3.5 Sonnet",
      kind: "anthropic",
      model: "claude-3-5-sonnet-20241022",
      api_key: "sk-ant-secret1234",
      is_default: true,
    })

    expect(created.id).toBe("22222222-2222-2222-2222-222222222222")
    expect(created.has_key).toBe(true)
    expect(created.masked_key).toBe("••••••••1234")

    const audit = vi.mocked(logAudit).mock.calls[0][0]
    expect(audit.action).toBe("ai_provider.create")
    expect(audit.metadata?.has_key).toBe(true)
    // The audit trail must never contain the credential itself.
    expect(JSON.stringify(audit)).not.toContain("sk-ant-secret1234")
  })

  it("updates an existing provider without replacing api_key if empty", async () => {
    mockUpdate.mockReturnValue({
      eq: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: {
                id: "11111111-1111-1111-1111-111111111111",
                label: "Gemini 2.0 Flash (Updated)",
                kind: "gemini",
                model: "gemini-2.0-flash",
                base_url: null,
                api_key: "existing_secret_key",
                is_default: true,
                created_at: new Date().toISOString(),
              },
              error: null,
            }),
        }),
      }),
    })

    const updated = await updateAiProvider("11111111-1111-1111-1111-111111111111", {
      label: "Gemini 2.0 Flash (Updated)",
      api_key: "", // empty means keep existing
    })

    expect(updated.label).toBe("Gemini 2.0 Flash (Updated)")
    expect(updated.has_key).toBe(true)
  })

  it("sets a provider as the new default and unsets others", async () => {
    const mockNeq = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockEq = vi.fn().mockResolvedValue({ data: null, error: null })

    mockUpdate
      .mockReturnValueOnce({ neq: mockNeq })
      .mockReturnValueOnce({ eq: mockEq })

    await setDefaultAiProvider("22222222-2222-2222-2222-222222222222")

    expect(mockNeq).toHaveBeenCalledWith("id", "22222222-2222-2222-2222-222222222222")
    expect(mockEq).toHaveBeenCalledWith("id", "22222222-2222-2222-2222-222222222222")
  })

  it("refuses to delete the last remaining provider", async () => {
    mockSelect
      .mockReturnValueOnce({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: { is_default: false, label: "Only provider", model: "m" },
              error: null,
            }),
        }),
      })
      .mockReturnValueOnce(Promise.resolve({ count: 1, error: null }))

    await expect(
      deleteAiProvider("33333333-3333-3333-3333-333333333333")
    ).rejects.toThrow(/satu-satunya/)

    expect(mockDelete).not.toHaveBeenCalled()
  })
})
