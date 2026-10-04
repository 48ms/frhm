import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { AccountCard } from "./social-accounts-board"
import type { SocialAccount } from "./social-data"

const mockAccount: SocialAccount = {
  id: "test-1",
  platform: "Instagram",
  handle: "@test.account",
  name: "Test Account",
  fans: "100K",
  growth: "+5.2%",
  status: "SYNCED",
  icon: "photo_camera",
  bg: "bg-gradient-to-tr from-amber-400 to-purple-600",
  fg: "text-white",
  metrics: { reach: "500K", posts: "42", likes: "12K" },
}

vi.mock("@/components/icons", () => {
  const Stub = () => <span data-testid="icon" />
  return { Icons: new Proxy({}, { get: () => Stub }) }
})

describe("AccountCard", () => {
  it("renders Manage button for normal accounts", () => {
    const onDisconnect = vi.fn()
    const onManageAccess = vi.fn()
    render(<AccountCard account={mockAccount} onDisconnect={onDisconnect} onManageAccess={onManageAccess} />)

    const manageBtn = screen.getByRole("button", { name: /Manage/i })
    expect(manageBtn).toBeDefined()
  })

  it("renders Reconnect button for TOKEN_EXPIRING accounts", () => {
    const expiringAccount = { ...mockAccount, status: "TOKEN_EXPIRING" as const }
    render(<AccountCard account={expiringAccount} onDisconnect={vi.fn()} onManageAccess={vi.fn()} />)

    expect(screen.getByRole("button", { name: /Reconnect account/i })).toBeDefined()
  })

  it("exposes a more-actions menu trigger for normal accounts", () => {
    render(<AccountCard account={mockAccount} onDisconnect={vi.fn()} onManageAccess={vi.fn()} />)

    const menuTrigger = screen.getByRole("button", { name: /More actions/i })
    expect(menuTrigger).toBeDefined()
  })

  it("opens the overflow menu and calls onDisconnect from the item", () => {
    const onDisconnect = vi.fn()
    const onManageAccess = vi.fn()
    render(<AccountCard account={mockAccount} onDisconnect={onDisconnect} onManageAccess={onManageAccess} />)

    const menuTrigger = screen.getByRole("button", { name: /More actions/i })
    fireEvent.click(menuTrigger)

    const disconnectItem = screen.getByText(/^Disconnect$/i)
    fireEvent.click(disconnectItem)

    expect(onDisconnect).toHaveBeenCalledWith(mockAccount.id, mockAccount.handle)
  })
})
