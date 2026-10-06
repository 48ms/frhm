import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DisconnectDialog } from "./disconnect-dialog"

vi.mock("@/components/icons", () => {
  const Stub = () => <span data-testid="icon" />
  return { Icons: new Proxy({}, { get: () => Stub }) }
})

describe("DisconnectDialog", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <DisconnectDialog open={false} handle="@x" onConfirm={vi.fn()} onClose={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it("names the target and the destructive verb on the confirm button", () => {
    render(<DisconnectDialog open handle="@shell.creative" onConfirm={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByText(/Disconnect @shell.creative\?/i)).toBeDefined()
    expect(screen.getByRole("button", { name: /Disconnect @shell.creative/i })).toBeDefined()
    expect(screen.getByRole("button", { name: /Keep account/i })).toBeDefined()
  })

  it("fires onConfirm and onClose from the right buttons", () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()
    render(<DisconnectDialog open handle="@x" onConfirm={onConfirm} onClose={onClose} />)

    fireEvent.click(screen.getByRole("button", { name: /Keep account/i }))
    expect(onClose).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: /Disconnect @x/i }))
    expect(onConfirm).toHaveBeenCalled()
  })
})
