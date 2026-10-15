import { describe, it, expect, vi, beforeEach } from "vitest"
import { executeWoopSocialTool, WOOPSOCIAL_MCP_TOOLS } from "./woopsocial-mcp"

const mockGetBridgeKey = vi.fn()
const mockHealth = vi.fn()
const mockListSocialAccounts = vi.fn()
const mockValidatePost = vi.fn()
const mockCreatePost = vi.fn()
const mockListPosts = vi.fn()

vi.mock("@/lib/bridge/config", () => ({
  getBridgeKey: () => mockGetBridgeKey(),
}))

vi.mock("@/lib/bridge/woopsocial", () => ({
  health: (...args: unknown[]) => mockHealth(...args),
  listSocialAccounts: (...args: unknown[]) => mockListSocialAccounts(...args),
  validatePost: (...args: unknown[]) => mockValidatePost(...args),
  createPost: (...args: unknown[]) => mockCreatePost(...args),
  listPosts: (...args: unknown[]) => mockListPosts(...args),
  toBridgePlatform: (p: string) => (p === "INSTAGRAM" || p === "X" ? p : null),
}))

vi.mock("@/lib/supabase/service", () => ({
  createSupabaseServiceClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { id: "c-1", ayrshare_profile_key: "ayr-proj-123" },
          }),
        }),
      }),
    }),
  }),
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock("@/lib/audit/log", () => ({
  logAudit: vi.fn(),
}))

describe("WoopSocial MCP Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("exports valid MCP tool definitions with schemas", () => {
    expect(WOOPSOCIAL_MCP_TOOLS.length).toBe(5)
    const toolNames = WOOPSOCIAL_MCP_TOOLS.map((t) => t.name)
    expect(toolNames).toContain("woopsocial_health")
    expect(toolNames).toContain("woopsocial_list_social_accounts")
    expect(toolNames).toContain("woopsocial_validate_post")
    expect(toolNames).toContain("woopsocial_schedule_post")
    expect(toolNames).toContain("woopsocial_list_posts")
  })

  it("returns error if bridge API key is missing", async () => {
    mockGetBridgeKey.mockResolvedValue(null)

    const result = await executeWoopSocialTool("woopsocial_health", {})
    expect(result.success).toBe(false)
    expect(result.error).toContain("Bridge API Key belum dikonfigurasi")
  })

  it("executes woopsocial_health successfully", async () => {
    mockGetBridgeKey.mockResolvedValue("test-key")
    mockHealth.mockResolvedValue({ ok: true, data: [{ id: "p1", name: "Default" }] })

    const result = await executeWoopSocialTool("woopsocial_health", {})
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ status: "connected", details: [{ id: "p1", name: "Default" }] })
    expect(mockHealth).toHaveBeenCalledWith("test-key")
  })

  it("executes woopsocial_list_social_accounts with client tenant scoping", async () => {
    mockGetBridgeKey.mockResolvedValue("test-key")
    mockListSocialAccounts.mockResolvedValue({
      ok: true,
      data: [{ id: "acc-1", platform: "INSTAGRAM", username: "tarajucoffee" }],
    })

    const result = await executeWoopSocialTool("woopsocial_list_social_accounts", {
      clientId: "c-1",
    })
    expect(result.success).toBe(true)
    expect(mockListSocialAccounts).toHaveBeenCalledWith("test-key", "ayr-proj-123")
  })

  it("executes woopsocial_validate_post validating content and platform", async () => {
    mockGetBridgeKey.mockResolvedValue("test-key")
    mockValidatePost.mockResolvedValue({
      ok: true,
      data: { isValid: true, errors: [] },
    })

    const result = await executeWoopSocialTool("woopsocial_validate_post", {
      clientId: "c-1",
      platform: "INSTAGRAM",
      content: "Fresh roast coffee beans!",
    })
    expect(result.success).toBe(true)
    expect(mockValidatePost).toHaveBeenCalled()
  })

  it("executes woopsocial_schedule_post and records audit log", async () => {
    mockGetBridgeKey.mockResolvedValue("test-key")
    mockCreatePost.mockResolvedValue({
      ok: true,
      data: { id: "post-99", status: "SCHEDULED" },
    })

    const result = await executeWoopSocialTool("woopsocial_schedule_post", {
      clientId: "c-1",
      platform: "X",
      content: "Daily roast special",
      scheduledAt: "2026-11-01T09:00:00Z",
    })
    expect(result.success).toBe(true)
    expect(mockCreatePost).toHaveBeenCalled()
  })

  it("returns error for unknown tool", async () => {
    mockGetBridgeKey.mockResolvedValue("test-key")

    const result = await executeWoopSocialTool("non_existent_tool", {})
    expect(result.success).toBe(false)
    expect(result.error).toContain("tidak dikenali")
  })
})
