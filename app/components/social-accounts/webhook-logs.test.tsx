import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { WebhookLogs } from "./webhook-logs"

describe("WebhookLogs", () => {
  it("renders the activity table", () => {
    render(<WebhookLogs />)

    expect(screen.getByText(/Recent posts and webhook activity/i)).toBeDefined()
    expect(screen.getByText(/@b2bshell/i)).toBeDefined()
  })

  it("opens the delivery detail dialog for a successful row", async () => {
    render(<WebhookLogs />)

    fireEvent.click(screen.getAllByRole("button", { name: /View details/i })[0])

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined()
      expect(screen.getByText(/Webhook delivered/i)).toBeDefined()
      expect(screen.getByText(/200 OK/i)).toBeDefined()
      expect(screen.getByText(/Payload received by Instagram/i)).toBeDefined()
    })
  })

  it("shows the failure reason for an error row", async () => {
    render(<WebhookLogs />)

    fireEvent.click(screen.getByRole("button", { name: /Reconnect/i }))

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeDefined()
      expect(screen.getByText(/Delivery failed/i)).toBeDefined()
      expect(screen.getByText(/Access token expired/i)).toBeDefined()
      expect(screen.getByText(/Reconnect the account/i)).toBeDefined()
    })
  })

  it("closes the detail dialog", async () => {
    render(<WebhookLogs />)

    fireEvent.click(screen.getAllByRole("button", { name: /View details/i })[0])
    await waitFor(() => expect(screen.getByRole("dialog")).toBeDefined())

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull()
    })
  })

  it("copies the request id when the copy button is pressed", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(<WebhookLogs />)

    fireEvent.click(screen.getAllByRole("button", { name: /View details/i })[0])
    await waitFor(() => expect(screen.getByRole("dialog")).toBeDefined())

    fireEvent.click(screen.getByRole("button", { name: /Copy request id/i }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledOnce()
    })
  })
})
