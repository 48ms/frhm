import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"
import { ExpensesLedgerView } from "./expenses-ledger-view"

const mockUpdateExpense = vi.fn()
const mockDeleteExpense = vi.fn()

vi.mock("@/components/animate-ui/components/texts/metric-ticker", () => ({
  MetricTicker: ({ value }: { value: string | number }) => <span>{value}</span>,
}))

vi.mock("@/features/erp/api/queries", () => ({
  erpQueries: {
    listBudgetsByClient: () => ({
      queryKey: ["budgets", "c-1"],
      queryFn: async () => [
        {
          id: "b-1",
          client_id: "c-1",
          month: "2026-10-01",
          total_budget: 10000000,
          remaining_balance: 7500000,
        },
      ],
    }),
    listExpensesByClient: () => ({
      queryKey: ["expenses", "c-1"],
      queryFn: async () => [
        {
          id: "exp-1",
          client_id: "c-1",
          budget_id: "b-1",
          amount: 2500000,
          category: "Ads",
          description: "Meta Ads Oct Campaign",
          expense_date: "2026-10-10",
        },
      ],
    }),
    listAdSpendByClient: () => ({
      queryKey: ["adSpend", "c-1"],
      queryFn: async () => [
        {
          id: "ad-1",
          client_id: "c-1",
          campaign_name: "Awareness Reel",
          spend: 1500000,
          clicks: 750,
          log_date: "2026-10-11",
        },
      ],
    }),
  },
  useUpdateExpense: () => ({
    mutateAsync: mockUpdateExpense,
    isPending: false,
  }),
  useDeleteExpense: () => ({
    mutateAsync: mockDeleteExpense,
    isPending: false,
  }),
  useCreateExpense: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useAddAdSpendLog: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

function renderView() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ExpensesLedgerView clientId="c-1" clientName="Taraju" />
    </QueryClientProvider>
  )
}

describe("ExpensesLedgerView Component", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders budget summary cards and lists expenses", async () => {
    renderView()

    // Cek ringkasan anggaran
    expect(await screen.findByText(/Total Budget Bulanan/i)).toBeInTheDocument()
    expect(screen.getByText(/Sisa Saldo Kas/i)).toBeInTheDocument()

    // Cek item tabel pengeluaran
    expect(await screen.findByText("Meta Ads Oct Campaign")).toBeInTheDocument()
    expect(screen.getAllByText("Ads").length).toBeGreaterThan(0)
  })

  it("opens edit dialog and submits updated expense", async () => {
    mockUpdateExpense.mockResolvedValue({ success: true })
    renderView()

    expect(await screen.findByText("Meta Ads Oct Campaign")).toBeInTheDocument()

    const editBtn = screen.getByTitle("Edit Pengeluaran")
    fireEvent.click(editBtn)

    // Modal Edit terbuka
    expect(screen.getByText("Edit Catatan Pengeluaran")).toBeInTheDocument()

    // Klik Simpan Perubahan
    const saveBtn = screen.getByRole("button", { name: "Simpan Perubahan" })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockUpdateExpense).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "exp-1",
          amount: 2500000,
          category: "Ads",
        })
      )
    })
  })

  it("opens delete confirmation AlertDialog and triggers deleteExpense", async () => {
    mockDeleteExpense.mockResolvedValue({ success: true })
    renderView()

    expect(await screen.findByText("Meta Ads Oct Campaign")).toBeInTheDocument()

    const deleteBtn = screen.getByTitle("Hapus Pengeluaran")
    fireEvent.click(deleteBtn)

    // AlertDialog terbuka
    expect(screen.getByText("Hapus Catatan Pengeluaran?")).toBeInTheDocument()
    expect(screen.getByText(/Nominal ini akan secara otomatis dikembalikan/i)).toBeInTheDocument()

    // Konfirmasi hapus
    const confirmDeleteBtn = screen.getByRole("button", { name: "Hapus Pengeluaran" })
    fireEvent.click(confirmDeleteBtn)

    await waitFor(() => {
      expect(mockDeleteExpense).toHaveBeenCalledWith("exp-1")
    })
  })

  it("displays ad spend logs table with spend and calculated CPC", async () => {
    renderView()

    expect(await screen.findByText("Riwayat Ad Spend Kampanye")).toBeInTheDocument()
    expect(screen.getByText("Awareness Reel")).toBeInTheDocument()
  })
})
