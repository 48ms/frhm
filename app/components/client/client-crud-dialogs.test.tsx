import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { EditClientDialog } from "./edit-client-dialog"
import { DeleteClientDialog } from "./delete-client-dialog"

const mockMutateAsyncUpdate = vi.fn()
const mockMutateAsyncDelete = vi.fn()

vi.mock("@/features/clients/api/queries", () => ({
  useUpdateClient: () => ({
    mutateAsync: mockMutateAsyncUpdate,
    isPending: false,
  }),
  useDeleteClient: () => ({
    mutateAsync: mockMutateAsyncDelete,
    isPending: false,
  }),
}))

describe("EditClientDialog & DeleteClientDialog CRUD Components", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const dummyClient = {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Taraju Coffee",
    contact_email: "halo@taraju.com",
    contact_phone: "08123456789",
    brand_profile: { who: "Taraju Coffee", niche: "F&B / Cafe", tagline: "Specialty beans" },
    channels: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as any

  it("renders EditClientDialog with prefilled data and submits successfully", async () => {
    const onOpenChange = vi.fn()
    mockMutateAsyncUpdate.mockResolvedValueOnce({ id: dummyClient.id, name: "Taraju Coffee Roastery" })

    render(
      <EditClientDialog
        open={true}
        onOpenChange={onOpenChange}
        client={dummyClient}
      />
    )

    expect(screen.getByText("Edit Client Workspace")).toBeDefined()
    const nameInput = screen.getByLabelText(/Nama Brand \/ Workspace/i) as HTMLInputElement
    expect(nameInput.value).toBe("Taraju Coffee")

    fireEvent.change(nameInput, { target: { value: "Taraju Coffee Roastery" } })
    const submitBtn = screen.getByRole("button", { name: /Simpan Perubahan/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockMutateAsyncUpdate).toHaveBeenCalledTimes(1)
      expect(mockMutateAsyncUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: dummyClient.id,
          name: "Taraju Coffee Roastery",
        })
      )
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it("renders DeleteClientDialog and enables delete button only after typing exact client name", async () => {
    const onOpenChange = vi.fn()
    const onDeleted = vi.fn()
    mockMutateAsyncDelete.mockResolvedValueOnce({ success: true, id: dummyClient.id, name: dummyClient.name })

    render(
      <DeleteClientDialog
        open={true}
        onOpenChange={onOpenChange}
        client={dummyClient}
        onDeleted={onDeleted}
      />
    )

    expect(screen.getByText("Hapus Client Workspace?")).toBeDefined()
    const deleteButton = screen.getByRole("button", { name: /Hapus Permanen/i })
    expect(deleteButton).toBeDisabled()

    // Type partial/incorrect name
    const confirmInput = screen.getByPlaceholderText(dummyClient.name)
    fireEvent.change(confirmInput, { target: { value: "Salah Nama" } })
    expect(deleteButton).toBeDisabled()

    // Type exact client name
    fireEvent.change(confirmInput, { target: { value: dummyClient.name } })
    expect(deleteButton).not.toBeDisabled()

    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(mockMutateAsyncDelete).toHaveBeenCalledTimes(1)
      expect(mockMutateAsyncDelete).toHaveBeenCalledWith(dummyClient.id)
      expect(onOpenChange).toHaveBeenCalledWith(false)
      expect(onDeleted).toHaveBeenCalledWith(dummyClient.id)
    })
  })
})
