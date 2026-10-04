import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { ManageAccessDialog } from "./manage-access-dialog"
import type { SocialAccount } from "./social-data"

vi.mock("@/components/icons", () => {
  const Stub = () => <span data-testid="icon" />
  return { Icons: new Proxy({}, { get: () => Stub }) }
})

const account: SocialAccount = {
  id: "acc-1",
  platform: "Instagram",
  handle: "@shell.creative",
  name: "Shell Creative Studio",
  fans: "428K",
  status: "SYNCED",
  icon: "photo_camera",
  bg: "bg-rose-500",
  fg: "text-white",
}

describe("ManageAccessDialog", () => {
  it("lists required scopes as locked and optional scopes as toggles", () => {
    render(<ManageAccessDialog open account={account} onClose={vi.fn()} />)

    expect(screen.getByText("instagram_basic")).toBeDefined()
    expect(screen.getByText(/Required to stay connected/i)).toBeDefined()
    expect(screen.getByText(/Optional/i)).toBeDefined()
    expect(screen.getByRole("switch", { name: "instagram_content_publish" })).toBeDefined()
  })

  it("shows the trade-off when an optional scope is switched off", () => {
    render(<ManageAccessDialog open account={account} onClose={vi.fn()} />)

    const toggle = screen.getByRole("switch", { name: "instagram_content_publish" })
    fireEvent.click(toggle)

    expect(toggle.getAttribute("aria-checked")).toBe("false")
    expect(screen.getByText(/will not go out/i)).toBeDefined()
  })

  it("keeps Save disabled until a scope actually changes", () => {
    render(<ManageAccessDialog open account={account} onClose={vi.fn()} />)

    const save = screen.getByRole("button", { name: /Save changes/i })
    expect(save.hasAttribute("disabled")).toBe(true)

    fireEvent.click(screen.getByRole("switch", { name: "instagram_content_publish" }))
    expect(save.hasAttribute("disabled")).toBe(false)
  })

  it("does not render account content when closed", () => {
    render(<ManageAccessDialog open={false} account={account} onClose={vi.fn()} />)
    expect(screen.queryByText("instagram_basic")).toBeNull()
  })

  it("records an audit entry when scopes are saved", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    vi.stubGlobal("fetch", fetchSpy)

    render(<ManageAccessDialog open account={account} onClose={vi.fn()} />)

    fireEvent.click(screen.getByRole("switch", { name: "instagram_content_publish" }))
    fireEvent.click(screen.getByRole("button", { name: /Save changes/i }))

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/social/audit",
        expect.objectContaining({ method: "POST" })
      )
    })

    const body = JSON.parse(fetchSpy.mock.calls[0][1].body)
    expect(body.accountId).toBe("acc-1")
    expect(body.newScopes).not.toContain("instagram_content_publish")
    expect(body.oldScopes).toContain("instagram_content_publish")

    vi.unstubAllGlobals()
  })
})
