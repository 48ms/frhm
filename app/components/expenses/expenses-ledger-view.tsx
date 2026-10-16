"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/animate-ui/components/radix/alert-dialog"
import {
  erpQueries,
  useUpdateExpense,
  useDeleteExpense,
} from "@/features/erp/api/queries"
import type { Expense, ClientBudget, AdSpendLog } from "@/features/erp/api/types"
import { CreateExpenseForm } from "./create-expense-form"
import { AddAdSpendLogForm } from "./add-ad-spend-log-form"

interface ExpensesLedgerViewProps {
  clientId: string
  clientName: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Operational: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  Ads: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  KOL: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Production: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Tools: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  Lainnya: "bg-muted text-muted-foreground border-border/40",
}

function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "-"
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

export function ExpensesLedgerView({ clientId, clientName }: ExpensesLedgerViewProps) {
  const { data: budgets = [] } = useQuery({
    ...erpQueries.listBudgetsByClient(clientId),
    placeholderData: [],
  })
  const { data: expenses = [] } = useQuery({
    ...erpQueries.listExpensesByClient(clientId),
    placeholderData: [],
  })
  const { data: adSpendLogs = [] } = useQuery({
    ...erpQueries.listAdSpendByClient(clientId),
    placeholderData: [],
  })

  const [createOpen, setCreateOpen] = React.useState(false)
  const [adSpendOpen, setAdSpendOpen] = React.useState(false)
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = React.useState<Expense | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")

  const updateExpenseMutation = useUpdateExpense()
  const deleteExpenseMutation = useDeleteExpense()

  // Ambil anggaran bulan aktif terkini
  const activeBudget: ClientBudget | undefined = budgets[0]
  const totalBudget = activeBudget?.total_budget ?? 0
  const remainingBalance = activeBudget?.remaining_balance ?? 0
  const totalSpent = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0)
  const spentPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0

  // Filter daftar pengeluaran
  const filteredExpenses = React.useMemo(() => {
    return expenses.filter((exp) => {
      if (categoryFilter !== "all" && exp.category !== categoryFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const descMatch = (exp.description ?? "").toLowerCase().includes(q)
        const catMatch = (exp.category ?? "").toLowerCase().includes(q)
        if (!descMatch && !catMatch) return false
      }
      return true
    })
  }, [expenses, categoryFilter, searchQuery])

  // Total Ad Spend
  const totalAdSpend = adSpendLogs.reduce((acc, curr) => acc + (curr.spend || 0), 0)
  const totalAdClicks = adSpendLogs.reduce((acc, curr) => acc + (curr.clicks || 0), 0)
  const avgCpc = totalAdClicks > 0 ? Math.round(totalAdSpend / totalAdClicks) : 0

  const handleDeleteConfirm = async () => {
    if (!deletingExpense) return
    try {
      await deleteExpenseMutation.mutateAsync(deletingExpense.id)
      setDeletingExpense(null)
    } catch {
      // Toast ditangani di hook
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. KARTU RINGKASAN ANGGARAN & FINOPS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Anggaran */}
        <div className="p-5 admin-card rounded-2xl border border-border/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Budget Bulanan
            </span>
            <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Icons.creditCard className="size-4" />
            </div>
          </div>
          <div className="my-3">
            <span className="text-2xl font-bold font-mono text-foreground">
              {formatIDR(totalBudget)}
            </span>
          </div>
          <p className="text-2xs text-muted-foreground">
            Alokasi aktif untuk {clientName}
          </p>
        </div>

        {/* Sisa Saldo Tersedia */}
        <div className="p-5 admin-card rounded-2xl border border-border/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Sisa Saldo Kas
            </span>
            <div className="size-8 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <Icons.coin className="size-4" />
            </div>
          </div>
          <div className="my-3">
            <span className="text-2xl font-bold font-mono text-success">
              {formatIDR(remainingBalance)}
            </span>
          </div>
          <p className="text-2xs text-muted-foreground">
            {remainingBalance <= 0
              ? "Peringatan: Saldo telah habis!"
              : "Tersedia untuk pengeluaran mendatang"}
          </p>
        </div>

        {/* Total Pengeluaran Tercatat */}
        <div className="p-5 admin-card rounded-2xl border border-border/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Realisasi Biaya
            </span>
            <div className="size-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Icons.chartBar className="size-4" />
            </div>
          </div>
          <div className="my-3">
            <span className="text-2xl font-bold font-mono text-foreground">
              {formatIDR(totalSpent)}
            </span>
          </div>
          <p className="text-2xs text-muted-foreground">
            Dari <MetricTicker value={expenses.length} /> transaksi tercatat
          </p>
        </div>

        {/* Persentase Realisasi & Status */}
        <div className="p-5 admin-card rounded-2xl border border-border/40 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Persentase Terpakai
            </span>
            <Badge
              variant="outline"
              className={
                spentPercentage >= 90
                  ? "border-destructive/40 text-destructive bg-destructive/10"
                  : spentPercentage >= 70
                  ? "border-warning/40 text-warning bg-warning/10"
                  : "border-success/40 text-success bg-success/10"
              }
            >
              {spentPercentage >= 100
                ? "Overbudget"
                : spentPercentage >= 90
                ? "Kritis"
                : "Aman"}
            </Badge>
          </div>
          <div className="my-3">
            <span className="text-3xl font-black font-mono text-foreground">
              <MetricTicker value={spentPercentage} />%
            </span>
          </div>
          <p className="text-2xs text-muted-foreground">
            {spentPercentage >= 90
              ? "Otomatis memicu notifikasi threshold Telegram"
              : "Penggunaan biaya dalam batas wajar"}
          </p>
        </div>
      </div>

      {/* 2. TABEL PENGELUARAN (EXPENSES LEDGER) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">
              Buku Kas & Pengeluaran ({expenses.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Daftar seluruh item pengeluaran operasional, iklan, KOL, dan tools.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAdSpendOpen(true)}
              className="text-xs rounded-xl h-8 gap-1.5 cursor-pointer"
            >
              <Icons.sparkles className="size-3.5 text-primary" />
              Catat Ad Spend
            </Button>
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="text-xs rounded-xl h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
            >
              <Icons.add className="size-3.5" />
              Catat Pengeluaran
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {["all", "Operational", "Ads", "KOL", "Production", "Tools", "Lainnya"].map((cat) => (
              <Button
                key={cat}
                type="button"
                variant={categoryFilter === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(cat)}
                className="text-xs font-semibold h-7 px-3 rounded-full cursor-pointer"
              >
                {cat === "all" ? "Semua Kategori" : cat}
              </Button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pengeluaran..."
              className="pl-8 h-8 text-xs rounded-xl"
            />
          </div>
        </div>

        {/* Expenses List Table */}
        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Deskripsi</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <Icons.inbox className="size-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm font-semibold">Belum Ada Catatan Pengeluaran</p>
                      <p className="text-2xs">
                        Klik tombol &ldquo;Catat Pengeluaran&rdquo; untuk menambahkan transaksi baru.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const badgeClass =
                      CATEGORY_COLORS[exp.category || ""] || CATEGORY_COLORS.Lainnya
                    return (
                      <tr key={exp.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-mono text-muted-foreground whitespace-nowrap">
                          {formatDate(exp.expense_date || exp.created_at)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge variant="outline" className={`text-2xs font-semibold ${badgeClass}`}>
                            {exp.category || "Lainnya"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground max-w-md truncate">
                          {exp.description || "-"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-foreground whitespace-nowrap">
                          {formatIDR(exp.amount)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingExpense(exp)}
                              className="size-7 p-0 rounded-lg hover:bg-secondary cursor-pointer text-muted-foreground hover:text-foreground"
                              title="Edit Pengeluaran"
                            >
                              <Icons.edit className="size-3.5" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingExpense(exp)}
                              className="size-7 p-0 rounded-lg hover:bg-destructive/10 cursor-pointer text-muted-foreground hover:text-destructive"
                              title="Hapus Pengeluaran"
                            >
                              <Icons.delete className="size-3.5" />
                              <span className="sr-only">Hapus</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3. TABEL AD SPEND LOGS */}
      {adSpendLogs.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-border/30">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Riwayat Ad Spend Kampanye
              </h3>
              <p className="text-xs text-muted-foreground">
                Rincian biaya iklan berbayar (Meta Ads, TikTok Ads, YouTube Ads) per kampanye.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                Total Spend: <strong className="text-foreground">{formatIDR(totalAdSpend)}</strong>
              </span>
              <span>•</span>
              <span>
                Total Klik: <strong className="text-foreground"><MetricTicker value={totalAdClicks} /></strong>
              </span>
              <span>•</span>
              <span>
                Avg CPC: <strong className="text-foreground">{formatIDR(avgCpc)}</strong>
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Tanggal</th>
                    <th className="py-2.5 px-4">Nama Campaign</th>
                    <th className="py-2.5 px-4 text-right">Biaya (IDR)</th>
                    <th className="py-2.5 px-4 text-right">Klik</th>
                    <th className="py-2.5 px-4 text-right">Est. CPC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {adSpendLogs.map((log) => {
                    const cpc = log.clicks > 0 ? Math.round(log.spend / log.clicks) : 0
                    return (
                      <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                          {formatDate(log.log_date || log.created_at)}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-foreground">
                          {log.campaign_name}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-foreground">
                          {formatIDR(log.spend)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                          {log.clicks.toLocaleString("id-ID")}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-muted-foreground">
                          {formatIDR(cpc)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* DIALOG CATAT EXPENSE BARU */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Pengeluaran Baru</DialogTitle>
            <DialogDescription>
              Tambahkan pengeluaran untuk {clientName}. Saldo anggaran akan dipotong secara otomatis.
            </DialogDescription>
          </DialogHeader>
          <CreateExpenseForm
            clientId={clientId}
            budgetId={activeBudget?.id}
            onSuccess={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* DIALOG CATAT AD SPEND */}
      <Dialog open={adSpendOpen} onOpenChange={setAdSpendOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Log Ad Spend</DialogTitle>
            <DialogDescription>
              Catat performa dan biaya kampanye berbayar untuk {clientName}.
            </DialogDescription>
          </DialogHeader>
          <AddAdSpendLogForm
            clientId={clientId}
            onSuccess={() => setAdSpendOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* DIALOG EDIT EXPENSE */}
      {editingExpense && (
        <EditExpenseDialog
          open={Boolean(editingExpense)}
          onOpenChange={(open) => !open && setEditingExpense(null)}
          expense={editingExpense}
        />
      )}

      {/* ALERT DIALOG HAPUS EXPENSE */}
      <AlertDialog
        open={Boolean(deletingExpense)}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Catatan Pengeluaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Pengeluaran sebesar{" "}
              <strong>
                {deletingExpense ? formatIDR(deletingExpense.amount) : "0"}
              </strong>{" "}
              ({deletingExpense?.category || "Lainnya"}) akan dihapus. Nominal ini akan
              secara otomatis dikembalikan (*re-credited*) ke saldo kas klien.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingExpense(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteExpenseMutation.isPending}
            >
              Hapus Pengeluaran
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EditExpenseDialog({
  open,
  onOpenChange,
  expense,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: Expense
}) {
  const [amount, setAmount] = React.useState(String(expense.amount || ""))
  const [category, setCategory] = React.useState(expense.category || "Operational")
  const [description, setDescription] = React.useState(expense.description || "")
  const [expenseDate, setExpenseDate] = React.useState(
    expense.expense_date ? expense.expense_date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  )

  const updateMutation = useUpdateExpense()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) return

    try {
      await updateMutation.mutateAsync({
        id: expense.id,
        amount: num,
        category,
        description,
        expense_date: expenseDate,
      })
      onOpenChange(false)
    } catch {
      // Toast ditangani di hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Catatan Pengeluaran</DialogTitle>
          <DialogDescription>
            Perbarui rincian pengeluaran. Perubahan nominal akan merekonsiliasi saldo anggaran secara otomatis.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="edit-expense-amount" className="text-xs font-semibold">
                Nominal (IDR)
              </Label>
              <Input
                id="edit-expense-amount"
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-expense-cat" className="text-xs font-semibold">
                Kategori
              </Label>
              <select
                id="edit-expense-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {["Operational", "Ads", "KOL", "Production", "Tools", "Lainnya"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="edit-expense-date" className="text-xs font-semibold">
                Tanggal Pengeluaran
              </Label>
              <Input
                id="edit-expense-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-expense-desc" className="text-xs font-semibold">
                Deskripsi
              </Label>
              <Input
                id="edit-expense-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Boost reels kampanye"
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              isLoading={updateMutation.isPending}
              className="text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
