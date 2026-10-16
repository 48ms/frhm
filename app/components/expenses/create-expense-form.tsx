'use client'

import { useState } from "react"
import { useCreateExpense } from "@/features/erp/api/queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"

const CATEGORY_OPTIONS = ["Operational", "Ads", "KOL", "Production", "Tools", "Lainnya"] as const

/**
 * Form pencatatan expense untuk client aktif.
 * Memakai mutasi `useCreateExpense` dari feature module ERP (SSOT) sehingga
 * cache expenses + budgets otomatis ter-invalidate setelah submit.
 */
export function CreateExpenseForm({
  clientId,
  budgetId,
  onSuccess,
}: {
  clientId: string
  budgetId?: string | null
  onSuccess?: () => void
}) {
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState<string>("Operational")
  const [description, setDescription] = useState("")
  const { mutate, isPending } = useCreateExpense()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(amount)
    if (isNaN(num) || num <= 0) return

    mutate(
      {
        client_id: clientId,
        budget_id: budgetId ?? null,
        amount: num,
        category,
        description,
        expense_date: new Date().toISOString(),
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            setAmount("")
            setDescription("")
            onSuccess?.()
          }
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-2xl bg-card border border-border/60 shadow-xs">
      <div className="space-y-1">
        <h4 className="font-semibold text-sm">Catat Pengeluaran Baru</h4>
        <p className="text-xs text-muted-foreground">
          Tambah item expense ke ledger operasional client ini.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="expense-amount" className="text-xs font-semibold">
            Nominal (IDR)
          </Label>
          <Input
            id="expense-amount"
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="500000"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="expense-category" className="text-xs font-semibold">
            Kategori
          </Label>
          <select
            id="expense-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="expense-desc" className="text-xs font-semibold">
            Deskripsi
          </Label>
          <Input
            id="expense-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Boost IG Reels Kampanye"
            className="mt-1"
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full admin-pill admin-pill-primary">
        {isPending ? (
          <Icons.spinner className="size-4 animate-spin mr-2" />
        ) : (
          <Icons.add className="size-4 mr-2" />
        )}
        Simpan Expense
      </Button>
    </form>
  )
}
