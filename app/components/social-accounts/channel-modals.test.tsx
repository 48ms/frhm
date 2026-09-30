import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TokenHealthModal, ChannelDetailDrawer } from "./channel-modals"
import type { SocialAccount, SocialClient } from "./social-data"

const client: SocialClient = {
  id: "client-test",
  name: "Test Client",
  shortName: "Test",
  initials: "TC",
  tagline: "Testing",
  accounts: [],
}

const account: SocialAccount = {
  id: "acc-test-1",
  platform: "Instagram",
  handle: "@test.handle",
  fans: "428K fans",
  status: "SYNCED",
  icon: "photo_camera",
  bg: "bg-[hsl(var(--admin-cobalt))]",
  fg: "text-white",
}

describe("TokenHealthModal — aksesibilitas & interaksi", () => {
  it("render dengan role=dialog dan aria-modal", () => {
    render(
      <TokenHealthModal
        account={account}
        client={client}
        open={true}
        onClose={() => {}}
        onRefreshed={() => {}}
      />
    )
    const dialog = screen.getByRole("dialog")
    expect(dialog).toBeTruthy()
    expect(dialog.getAttribute("aria-modal")).toBe("true")
    expect(dialog.getAttribute("aria-label")).toContain("Instagram")
  })

  it("menutup dialog saat tombol Escape ditekan", () => {
    const onClose = vi.fn()
    render(
      <TokenHealthModal
        account={account}
        client={client}
        open={true}
        onClose={onClose}
        onRefreshed={() => {}}
      />
    )
    const dialog = screen.getByRole("dialog")
    fireEvent.keyDown(dialog, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("tidak render saat open=false", () => {
    const { container } = render(
      <TokenHealthModal
        account={account}
        client={client}
        open={false}
        onClose={() => {}}
        onRefreshed={() => {}}
      />
    )
    expect(container.querySelector('[role="dialog"]')).toBeNull()
  })

  it("tombol close punya aria-label", () => {
    render(
      <TokenHealthModal
        account={account}
        client={client}
        open={true}
        onClose={() => {}}
        onRefreshed={() => {}}
      />
    )
    const closeBtn = screen.getByLabelText("Close token health dialog")
    expect(closeBtn).toBeTruthy()
  })

  it("menampilkan metrics deterministik yang BERBEDA antar akun (R-17)", () => {
    const accountB: SocialAccount = {
      ...account,
      id: "acc-test-9999",
      handle: "@different.handle",
    }

    const { unmount } = render(
      <ChannelDetailDrawer
        account={account}
        client={client}
        open={true}
        onClose={() => {}}
        onManage={() => {}}
        onReconnect={() => {}}
      />
    )
    const firstMetrics = Array.from(
      document.querySelectorAll('[role="dialog"] .grid span:first-child')
    ).map((el) => el.textContent)
    unmount()

    render(
      <ChannelDetailDrawer
        account={accountB}
        client={client}
        open={true}
        onClose={() => {}}
        onManage={() => {}}
        onReconnect={() => {}}
      />
    )
    const secondMetrics = Array.from(
      document.querySelectorAll('[role="dialog"] .grid span:first-child')
    ).map((el) => el.textContent)

    // Bukan angka statis yang sama untuk semua akun
    expect(firstMetrics).not.toEqual(secondMetrics)
    expect(firstMetrics[0]).toBe("428")
  })

  it("ChannelDetailDrawer: role=dialog, Escape menutup, tombol close ber-label", () => {
    const onClose = vi.fn()
    render(
      <ChannelDetailDrawer
        account={account}
        client={client}
        open={true}
        onClose={onClose}
        onManage={() => {}}
        onReconnect={() => {}}
      />
    )
    const dialog = screen.getByRole("dialog")
    expect(dialog.getAttribute("aria-modal")).toBe("true")
    expect(screen.getByLabelText("Close channel details")).toBeTruthy()
    fireEvent.keyDown(dialog, { key: "Escape" })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
