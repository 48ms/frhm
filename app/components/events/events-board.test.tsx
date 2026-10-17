import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { NuqsTestingAdapter } from "nuqs/adapters/testing"
import { EventsBoard } from "./events-board"

const mockEvents = [
  {
    id: "ev-1",
    client_id: "c-1",
    name: "Grand Launching Surabaya",
    description: "Peluncuran cabang baru Surabaya Timur",
    location: "Pakuwon Mall",
    event_date: "2026-11-20T10:00:00.000Z",
    status: "upcoming",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "ev-2",
    client_id: "c-1",
    name: "Influencer Gathering",
    description: "Temu komunitas kuliner",
    location: "Hotel Majapahit",
    event_date: "2026-10-15T13:00:00.000Z",
    status: "ongoing",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockMutateCreate = vi.fn()
const mockMutateUpdate = vi.fn()
const mockMutateDelete = vi.fn()

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: mockEvents,
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
  useMutation: vi.fn(),
  queryOptions: vi.fn((opts) => opts),
}))

vi.mock("@/features/events/api/queries", () => ({
  eventQueries: {
    listByClient: vi.fn(),
  },
  useCreateEvent: () => ({
    mutate: mockMutateCreate,
    isPending: false,
  }),
  useUpdateEvent: () => ({
    mutate: mockMutateUpdate,
    isPending: false,
  }),
  useDeleteEvent: () => ({
    mutate: mockMutateDelete,
    isPending: false,
  }),
}))

describe("EventsBoard Component with full CRUD", () => {
  const renderEventsBoard = (clientId = "c-1") =>
    render(
      <NuqsTestingAdapter>
        <EventsBoard clientId={clientId} />
      </NuqsTestingAdapter>
    )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders metric counters and event list properly", () => {
    renderEventsBoard("c-1")

    expect(screen.getByText("Grand Launching Surabaya")).toBeDefined()
    expect(screen.getByText("Influencer Gathering")).toBeDefined()
    expect(screen.getByText("Pakuwon Mall")).toBeDefined()
    expect(screen.getByText("Hotel Majapahit")).toBeDefined()
  })

  it("filters events by search query", async () => {
    renderEventsBoard("c-1")

    const searchInput = screen.getByPlaceholderText(/Cari nama event/i)
    fireEvent.change(searchInput, { target: { value: "Surabaya" } })

    expect(screen.getByText("Grand Launching Surabaya")).toBeDefined()
    await waitFor(() => {
      expect(screen.queryByText("Hotel Majapahit")).toBeNull()
    })
  })

  it("opens create event dialog when clicking Tambah Event", () => {
    renderEventsBoard("c-1")

    const addButtons = screen.getAllByRole("button", { name: /Tambah Event/i })
    fireEvent.click(addButtons[0])

    expect(screen.getByText("Tambah Event Baru")).toBeDefined()
  })

  it("triggers create mutation upon form submission", () => {
    renderEventsBoard("c-1")

    const addButtons = screen.getAllByRole("button", { name: /Tambah Event/i })
    fireEvent.click(addButtons[0])

    const nameInput = screen.getByLabelText(/Nama Event/i)
    fireEvent.change(nameInput, { target: { value: "Workshop Coffee Roasting" } })

    const submitBtn = screen.getByRole("button", { name: /Simpan Event/i })
    fireEvent.click(submitBtn)

    expect(mockMutateCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: "c-1",
        name: "Workshop Coffee Roasting",
      }),
      expect.any(Object)
    )
  })
})
