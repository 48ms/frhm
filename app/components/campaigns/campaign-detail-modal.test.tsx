import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { CampaignDetailModal } from "./campaign-detail-modal"
import type { Campaign } from "@/features/campaigns/api/types"
import type { ClientWithChannels } from "@/features/social-accounts/api/types"

const pushMock = vi.fn()
const onCloseMock = vi.fn()
const onEditMock = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}))

const MOCK_CAMPAIGN: Campaign = {
  id: "camp-123",
  client_id: "client-1",
  name: "Promo Akhir Tahun",
  type: "promo",
  start_date: "2026-12-01",
  end_date: "2026-12-31",
  color: "#F03020",
  notes: "Diskon 30% all items untuk pelanggan setia.",
  created_at: "2026-10-01T00:00:00Z",
}

const MOCK_CLIENT: ClientWithChannels = {
  id: "client-1",
  name: "Taraju",
  contact_email: "info@taraju.com",
  contact_phone: null,
  brand_profile: {
    who: "Taraju Digital",
    audience: "Business Owners",
    voice: "Professional",
    pov: "Expert",
    proof: "Case Studies",
    guardrails: "No spam",
    pillars: ["Strategy"],
  },
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  channels: [],
}

describe("CampaignDetailModal", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders campaign title, client, and notes correctly", () => {
    render(
      <CampaignDetailModal
        campaign={MOCK_CAMPAIGN}
        client={MOCK_CLIENT}
        open={true}
        onClose={onCloseMock}
        onEdit={onEditMock}
      />
    )

    expect(screen.getByText("Promo Akhir Tahun")).toBeInTheDocument()
    expect(screen.getByText("Taraju")).toBeInTheDocument()
    expect(screen.getByText("Diskon 30% all items untuk pelanggan setia.")).toBeInTheDocument()
  })

  it("navigates to Composer with campaign title and notes when 'Buka di Composer' is clicked", () => {
    render(
      <CampaignDetailModal
        campaign={MOCK_CAMPAIGN}
        client={MOCK_CLIENT}
        open={true}
        onClose={onCloseMock}
        onEdit={onEditMock}
      />
    )

    const composerBtn = screen.getByText("Buka di Composer")
    fireEvent.click(composerBtn)

    expect(onCloseMock).toHaveBeenCalled()
    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining("/admin/composer?title=Promo+Akhir+Tahun")
    )
  })

  it("triggers onEdit callback when 'Edit Campaign' is clicked", () => {
    render(
      <CampaignDetailModal
        campaign={MOCK_CAMPAIGN}
        client={MOCK_CLIENT}
        open={true}
        onClose={onCloseMock}
        onEdit={onEditMock}
      />
    )

    const editBtn = screen.getByText("Edit Campaign")
    fireEvent.click(editBtn)

    expect(onCloseMock).toHaveBeenCalled()
    expect(onEditMock).toHaveBeenCalledWith(MOCK_CAMPAIGN)
  })
})
