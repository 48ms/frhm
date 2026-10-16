import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getDeliverablesByClient,
  createDeliverable,
  promoteSkillOutputToDeliverable,
  updateDeliverableStatus,
  getDeliverableById,
  submitDeliverableReview,
  scheduleApprovedDeliverable,
  deleteDeliverable,
} from "./service"

const mockSupabase = {
  from: vi.fn(),
}

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}))

vi.mock("@/lib/supabase/service", () => ({
  createSupabaseServiceClient: vi.fn(() => mockSupabase),
}))

vi.mock("@/lib/audit/log", () => ({
  logAudit: vi.fn(),
}))

vi.mock("@/lib/telegram", () => ({
  sendTelegramMessage: vi.fn().mockResolvedValue({ ok: true }),
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

describe("Deliverables Service Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("getDeliverablesByClient returns list of deliverables", async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: [
        {
          id: "deliv-1",
          client_id: "client-1",
          type: "brief",
          title: "Strategy Brief",
          content_md: "Content",
          status: "draft",
        },
      ],
      error: null,
    })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockSupabase.from.mockReturnValue({ select: mockSelect })

    const result = await getDeliverablesByClient("client-1")
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe("Strategy Brief")
    expect(mockSupabase.from).toHaveBeenCalledWith("deliverables")
  })

  it("createDeliverable validates input and inserts into deliverables table", async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: "deliv-2",
        client_id: "client-1",
        type: "content",
        title: "Content Plan",
        content_md: "Markdown",
        status: "draft",
      },
      error: null,
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    mockSupabase.from.mockReturnValue({ insert: mockInsert })

    const result = await createDeliverable({
      clientId: "client-1",
      type: "content",
      title: "Content Plan",
      content_md: "Markdown",
      external_link: "",
    })

    expect(result.id).toBe("deliv-2")
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: "client-1",
        title: "Content Plan",
        status: "draft",
      })
    )
  })

  it("promoteSkillOutputToDeliverable fetches output, inserts deliverable, and updates skill_outputs", async () => {
    // 1. Fetch skill_output
    const mockOutputSingle = vi.fn().mockResolvedValue({
      data: {
        id: "out-100",
        client_id: "client-1",
        skill_id: "competitor-analysis",
        title: "Competitor Strategy",
        content: "Detailed intel",
        status: "draft",
        deliverable_id: null,
      },
      error: null,
    })
    const mockOutputEq = vi.fn().mockReturnValue({ single: mockOutputSingle })
    const mockOutputSelect = vi.fn().mockReturnValue({ eq: mockOutputEq })

    // 2. Insert deliverable
    const mockDelivSingle = vi.fn().mockResolvedValue({
      data: {
        id: "deliv-300",
        client_id: "client-1",
        type: "brief",
        title: "Competitor Strategy",
        content_md: "Detailed intel",
        status: "sent",
      },
      error: null,
    })
    const mockDelivSelect = vi.fn().mockReturnValue({ single: mockDelivSingle })
    const mockDelivInsert = vi.fn().mockReturnValue({ select: mockDelivSelect })

    // 3. Update skill_outputs
    const mockOutputUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const mockOutputUpdate = vi.fn().mockReturnValue({ eq: mockOutputUpdateEq })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "skill_outputs") {
        return {
          select: mockOutputSelect,
          update: mockOutputUpdate,
        }
      }
      if (table === "deliverables") {
        return {
          insert: mockDelivInsert,
        }
      }
      return {}
    })

    const result = await promoteSkillOutputToDeliverable({
      outputId: "out-100",
      clientId: "client-1",
    })

    expect(result.success).toBe(true)
    expect(result.deliverable?.id).toBe("deliv-300")
    expect(mockDelivInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: "client-1",
        title: "Competitor Strategy",
        status: "sent",
      })
    )
    expect(mockOutputUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        deliverable_id: "deliv-300",
        status: "sent",
      })
    )
  })

  it("updateDeliverableStatus updates deliverable and syncs associated skill_outputs", async () => {
    const mockDelivUpdateEq2 = vi.fn().mockResolvedValue({ error: null })
    const mockDelivUpdateEq = vi.fn().mockReturnValue({ eq: mockDelivUpdateEq2 })
    const mockDelivUpdate = vi.fn().mockReturnValue({ eq: mockDelivUpdateEq })

    const mockOutputUpdateEq = vi.fn().mockResolvedValue({ error: null })
    const mockOutputUpdate = vi.fn().mockReturnValue({ eq: mockOutputUpdateEq })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "deliverables") {
        return { update: mockDelivUpdate }
      }
      if (table === "skill_outputs") {
        return { update: mockOutputUpdate }
      }
      return {}
    })

    const result = await updateDeliverableStatus({
      deliverableId: "22222222-2222-2222-2222-222222222222",
      clientId: "client-1",
      status: "approved",
    })

    expect(result.success).toBe(true)
    expect(mockDelivUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "approved",
      })
    )
    expect(mockOutputUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "approved",
      })
    )
  })

  it("getDeliverableById returns deliverable with client, comments, and feedback", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "deliverables") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "deliv-100",
                  client_id: "client-1",
                  title: "Social Media Strategy",
                  content_md: "## Content Brief",
                  status: "sent",
                },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === "clients") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "client-1",
                  name: "Taraju Coffee",
                  brand_profile: { tone: "casual" },
                },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === "deliverable_comments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "comm-1",
                    deliverable_id: "deliv-100",
                    author_name: "Pak Adit",
                    author_role: "client",
                    content: "Bagus sekali!",
                    created_at: "2026-10-15T00:00:00Z",
                  },
                ],
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === "feedback") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: "fb-1",
                    deliverable_id: "deliv-100",
                    client_id: "client-1",
                    rating: 5,
                    title: "Review",
                    comment: "Mantap",
                  },
                ],
                error: null,
              }),
            }),
          }),
        }
      }
      return {}
    })

    const result = await getDeliverableById("deliv-100")
    expect(result).not.toBeNull()
    expect(result?.deliverable.id).toBe("deliv-100")
    expect(result?.client?.name).toBe("Taraju Coffee")
    expect(result?.comments).toHaveLength(1)
    expect(result?.comments[0].author_name).toBe("Pak Adit")
    expect(result?.feedback).toHaveLength(1)
    expect(result?.feedback[0].rating).toBe(5)
  })

  it("submitDeliverableReview records approval, creates comments/feedback, and triggers notification", async () => {
    const mockDelivUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "deliv-100",
              client_id: "client-1",
              title: "Social Media Strategy",
              status: "approved",
            },
            error: null,
          }),
        }),
      }),
    })

    const mockOutputUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    const mockCommentInsert = vi.fn().mockResolvedValue({ error: null })
    const mockFeedbackInsert = vi.fn().mockResolvedValue({ error: null })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "deliverables") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "deliv-100",
                  client_id: "client-1",
                  title: "Social Media Strategy",
                  status: "sent",
                },
                error: null,
              }),
            }),
          }),
          update: mockDelivUpdate,
        }
      }
      if (table === "clients") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "client-1", name: "Taraju Coffee" },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === "skill_outputs") {
        return { update: mockOutputUpdate }
      }
      if (table === "deliverable_comments") {
        return { insert: mockCommentInsert }
      }
      if (table === "feedback") {
        return { insert: mockFeedbackInsert }
      }
      return {}
    })

    const result = await submitDeliverableReview({
      deliverableId: "11111111-1111-1111-1111-111111111111",
      status: "approved",
      rating: 5,
      feedbackNote: "Disetujui untuk tayang!",
      clientAuthorName: "Pak Adit",
    })

    expect(result.success).toBe(true)
    expect(result.deliverable?.status).toBe("approved")
    expect(mockDelivUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "approved",
      })
    )
    expect(mockCommentInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        author_name: "Pak Adit",
        content: "Disetujui untuk tayang!",
        author_role: "client",
      })
    )
    expect(mockFeedbackInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        rating: 5,
        client_id: "client-1",
      })
    )
  })

  it("scheduleApprovedDeliverable creates scheduled post from approved deliverable", async () => {
    const mockPostInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "post-999",
            client_id: "client-1",
            deliverable_id: "deliv-100",
            platform: "instagram",
            title: "Social Media Strategy",
            content: "Content",
            scheduled_at: "2026-10-16T10:00:00Z",
            status: "scheduled",
          },
          error: null,
        }),
      }),
    })

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "deliverables") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "deliv-100",
                  client_id: "client-1",
                  title: "Social Media Strategy",
                  content_md: "Content",
                  status: "approved",
                  type: "content",
                },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === "clients") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: "client-1", name: "Taraju Coffee" },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === "scheduled_posts") {
        return {
          insert: mockPostInsert,
        }
      }
      return {}
    })

    const result = await scheduleApprovedDeliverable({
      deliverableId: "11111111-1111-1111-1111-111111111111",
      clientId: "client-1",
      platform: "instagram",
      scheduledAt: "2026-10-16T10:00:00.000Z",
      customTitle: "Reels Post: Strategy",
    })

    expect(result.success).toBe(true)
    expect(result.scheduledPost?.id).toBe("post-999")
    expect(result.scheduledPost?.status).toBe("scheduled")
    expect(mockPostInsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          platform: "instagram",
          status: "scheduled",
          deliverable_id: "11111111-1111-1111-1111-111111111111",
        }),
      ])
    )
  })

  it("promoteSkillOutputToDeliverable rejects when output belongs to different client", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "skill_outputs") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "output-other",
                  client_id: "client-other",
                  skill_id: "competitor-audit",
                  title: "Other Client Strategy",
                  content: "Content",
                },
                error: null,
              }),
            }),
          }),
        }
      }
      return {}
    })

    const result = await promoteSkillOutputToDeliverable({
      outputId: "output-other",
      clientId: "client-1",
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain("tidak cocok")
  })

  it("scheduleApprovedDeliverable rejects when deliverable belongs to different client", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "deliverables") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "deliv-other",
                  client_id: "client-other",
                  title: "Other Client Deliverable",
                },
                error: null,
              }),
            }),
          }),
        }
      }
      return {}
    })

    const result = await scheduleApprovedDeliverable({
      deliverableId: "11111111-1111-1111-1111-111111111111",
      clientId: "client-1",
      platform: "instagram",
      scheduledAt: "2026-10-16T10:00:00.000Z",
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain("tidak cocok")
  })

  describe("deleteDeliverable", () => {
    it("deletes deliverable and updates linked skill_outputs", async () => {
      const mockDelivQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "deliv-del", client_id: "c-1", title: "Obsolete Draft" },
              error: null,
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }

      const mockSkillQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "deliverables") return mockDelivQuery
        if (table === "skill_outputs") return mockSkillQuery
        return {}
      })

      const res = await deleteDeliverable("deliv-del", "c-1")
      expect(res.success).toBe(true)
      expect(mockDelivQuery.delete).toHaveBeenCalled()
      expect(mockSkillQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({ deliverable_id: null, status: "draft" })
      )
    })

    it("returns error if database deletion fails", async () => {
      const mockDelivQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: "deliv-err", client_id: "c-1", title: "Err" },
              error: null,
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: "Foreign key constraint" } }),
        }),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "deliverables") return mockDelivQuery
        return {}
      })

      const res = await deleteDeliverable("deliv-err")
      expect(res.success).toBe(false)
      expect(res.error).toBe("Foreign key constraint")
    })
  })
})


