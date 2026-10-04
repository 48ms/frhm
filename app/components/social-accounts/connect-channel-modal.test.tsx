import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ConnectChannelModal } from "./connect-channel-modal"
import type { SocialClient } from "./social-data"

const client: SocialClient = {
  id: "client-test",
  name: "B2B Shell Representatives",
  shortName: "Test",
  initials: "BS",
  tagline: "Testing",
  accounts: [],
}

function openAtAuthorizeStep() {
  render(
    <ConnectChannelModal
      open={true}
      client={client}
      existingPlatforms={[]}
      onClose={() => {}}
      onConnected={() => {}}
    />
  )
  fireEvent.click(screen.getByRole("button", { name: /Instagram/i }))
}

describe("ConnectChannelModal — wizard flow", () => {
  it("menampilkan grid platform dengan status 'Soon' untuk platform belum tersedia", () => {
    render(
      <ConnectChannelModal
        open={true}
        client={client}
        existingPlatforms={[]}
        onClose={() => {}}
        onConnected={() => {}}
      />
    )
    // Instagram tersedia
    expect(screen.getByRole("button", { name: /Instagram/i })).toBeTruthy()
    const yt = screen.getByRole("button", { name: /YouTube/i })
    expect(yt.hasAttribute("disabled")).toBe(true)
  })

  it("menandai platform yang sudah terhubung dengan badge 'Connected'", () => {
    render(
      <ConnectChannelModal
        open={true}
        client={client}
        existingPlatforms={["TikTok"]}
        onClose={() => {}}
        onConnected={() => {}}
      />
    )
    expect(screen.getByText(/Connected/i)).toBeTruthy()
  })

  it("menampilkan daftar permission scopes di step otorisasi", () => {
    openAtAuthorizeStep()
    expect(screen.getByText(/Permissions requested/i)).toBeTruthy()
    expect(screen.getByText("instagram_content_publish")).toBeTruthy()
  })

  it("tombol Authorize connection HARUS disabled saat handle kosong", () => {
    openAtAuthorizeStep()
    const authBtn = screen.getByRole("button", { name: /Authorize connection/i })
    expect(authBtn.hasAttribute("disabled")).toBe(true)
  })

  it("mengaktifkan tombol authorize setelah handle diisi", () => {
    openAtAuthorizeStep()
    const input = screen.getByPlaceholderText("username") as HTMLInputElement
    fireEvent.change(input, { target: { value: "shell.creative" } })
    const authBtn = screen.getByRole("button", { name: /Authorize connection/i })
    expect(authBtn.hasAttribute("disabled")).toBe(false)
  })
})
