import { describe, it, expect } from "vitest"
import {
  dashboardParamsCache,
  serializeDashboardParams,
  calendarParamsCache,
  serializeCalendarParams,
  composerParamsCache,
  serializeComposerParams,
  campaignsParamsCache,
  serializeCampaignsParams,
  erpParamsCache,
  serializeErpParams,
  libraryParamsCache,
  serializeLibraryParams,
  aiParamsCache,
  serializeAiParams,
  analyticsParamsCache,
  serializeAnalyticsParams,
} from "./searchparams"

describe("lib/searchparams URL State Synchronization", () => {
  describe("Dashboard Params Cache & Serializer", () => {
    it("parses default values when empty params provided", () => {
      const parsed = dashboardParamsCache.parse({})
      expect(parsed.clientId).toBe("")
      expect(parsed.period).toBe("30d")
    })

    it("parses valid clientId and period", () => {
      const parsed = dashboardParamsCache.parse({
        clientId: "client-123",
        period: "90d",
      })
      expect(parsed.clientId).toBe("client-123")
      expect(parsed.period).toBe("90d")
    })

    it("serializes dashboard params correctly", () => {
      const url = serializeDashboardParams("/admin/dashboard", {
        clientId: "client-456",
        period: "7d",
      })
      expect(url).toContain("clientId=client-456")
      expect(url).toContain("period=7d")
    })
  })

  describe("Calendar Params Cache & Serializer", () => {
    it("parses defaults for calendar", () => {
      const parsed = calendarParamsCache.parse({})
      expect(parsed.clientId).toBe("")
      expect(parsed.platform).toBe("all")
      expect(parsed.view).toBe("month")
      expect(parsed.new).toBe("")
      expect(parsed.export).toBe("")
    })

    it("parses custom calendar view and platform", () => {
      const parsed = calendarParamsCache.parse({
        clientId: "c-1",
        platform: "tiktok",
        view: "week",
        new: "1",
      })
      expect(parsed.platform).toBe("tiktok")
      expect(parsed.view).toBe("week")
      expect(parsed.new).toBe("1")
    })

    it("serializes calendar query string", () => {
      const url = serializeCalendarParams("/admin/calendar", {
        clientId: "c-1",
        platform: "instagram",
        view: "list",
      })
      expect(url).toContain("platform=instagram")
      expect(url).toContain("view=list")
    })
  })

  describe("Composer Params Cache & Serializer", () => {
    it("parses and serializes composer parameters", () => {
      const parsed = composerParamsCache.parse({
        clientId: "c-1",
        title: "Test Post",
        content: "Content draft",
      })
      expect(parsed.title).toBe("Test Post")
      expect(parsed.content).toBe("Content draft")

      const url = serializeComposerParams("/admin/composer", {
        clientId: "c-1",
        title: "Test Post",
      })
      expect(url).toContain("title=Test+Post")
    })
  })

  describe("Campaigns Params Cache & Serializer", () => {
    it("parses defaults for campaigns", () => {
      const parsed = campaignsParamsCache.parse({})
      expect(parsed.tab).toBe("all")
      expect(parsed.q).toBe("")
      expect(parsed.view).toBe("list")
    })

    it("parses custom tab, search query, and gantt view", () => {
      const parsed = campaignsParamsCache.parse({
        tab: "active",
        q: "ramadan",
        view: "gantt",
      })
      expect(parsed.tab).toBe("active")
      expect(parsed.q).toBe("ramadan")
      expect(parsed.view).toBe("gantt")
    })

    it("serializes campaigns URL", () => {
      const url = serializeCampaignsParams("/admin/campaigns", {
        tab: "review",
        new: "1",
      })
      expect(url).toContain("tab=review")
      expect(url).toContain("new=1")
    })
  })

  describe("ERP Params Cache & Serializer", () => {
    it("parses defaults for ERP", () => {
      const parsed = erpParamsCache.parse({})
      expect(parsed.tab).toBe("deliverables")
      expect(parsed.status).toBe("all")
      expect(parsed.q).toBe("")
    })

    it("parses custom status and search in ERP", () => {
      const parsed = erpParamsCache.parse({
        tab: "deliverables",
        status: "approved",
        q: "q4 strategy",
      })
      expect(parsed.tab).toBe("deliverables")
      expect(parsed.status).toBe("approved")
      expect(parsed.q).toBe("q4 strategy")
    })

    it("serializes ERP parameters", () => {
      const url = serializeErpParams("/admin/erp", {
        tab: "expenses",
        status: "all",
      })
      expect(url).toContain("tab=expenses")
    })
  })

  describe("Library Params Cache & Serializer", () => {
    it("parses defaults for Media Library", () => {
      const parsed = libraryParamsCache.parse({})
      expect(parsed.fileType).toBe("all")
      expect(parsed.tag).toBe("")
      expect(parsed.q).toBe("")
    })

    it("parses video filter and tag", () => {
      const parsed = libraryParamsCache.parse({
        fileType: "video",
        tag: "reels",
        q: "promo",
      })
      expect(parsed.fileType).toBe("video")
      expect(parsed.tag).toBe("reels")
      expect(parsed.q).toBe("promo")
    })

    it("serializes library URL", () => {
      const url = serializeLibraryParams("/admin/library", {
        fileType: "image",
        tag: "hero",
      })
      expect(url).toContain("fileType=image")
      expect(url).toContain("tag=hero")
    })
  })

  describe("AI Studio Params Cache & Serializer", () => {
    it("parses defaults for AI Studio", () => {
      const parsed = aiParamsCache.parse({})
      expect(parsed.tab).toBe("ideas")
      expect(parsed.category).toBe("all")
      expect(parsed.pack).toBe("all")
      expect(parsed.viewMode).toBe("packs")
    })

    it("parses playbooks tab and skill deep link", () => {
      const parsed = aiParamsCache.parse({
        tab: "playbooks",
        category: "Visual & design",
        skill: "brand-profile",
        interview: "true",
      })
      expect(parsed.tab).toBe("playbooks")
      expect(parsed.category).toBe("Visual & design")
      expect(parsed.skill).toBe("brand-profile")
      expect(parsed.interview).toBe("true")
    })

    it("serializes AI Studio URL", () => {
      const url = serializeAiParams("/admin/ai", {
        tab: "brand-brain",
        skill: "brand-profile",
      })
      expect(url).toContain("tab=brand-brain")
      expect(url).toContain("skill=brand-profile")
    })
  })

  describe("Analytics Params Cache & Serializer", () => {
    it("parses defaults for Analytics", () => {
      const parsed = analyticsParamsCache.parse({})
      expect(parsed.platform).toBe("all")
      expect(parsed.period).toBe("30d")
    })

    it("serializes Analytics params", () => {
      const url = serializeAnalyticsParams("/admin/analytics", {
        platform: "tiktok",
        period: "90d",
      })
      expect(url).toContain("platform=tiktok")
      expect(url).toContain("period=90d")
    })
  })
})
