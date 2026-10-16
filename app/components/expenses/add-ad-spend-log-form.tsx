'use client'

import { useState } from "react"
import { useAddAdSpendLog } from "@/features/erp/api/queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"

/**
 * Form pencatatan log ad spend untuk campaign.
 * Memakai mutasi `useAddAdSpendLog` dari ERP feature module (SSOT).
 */
export function AddAdSpendLogForm({ clientId, onSuccess }: { clientId: string; onSuccess?: () => void }) {
  const [campaignName, setCampaignName] = useState("")
  const [spend, setSpend] = useState("")
  const [clicks, setClicks] = useState("")
  const { mutate, isPending } = useAddAdSpendLog()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(spend)
    const clicksNum = clicks ? parseInt(clicks, 10) : 0
    if (isNaN(num) || num <= 0) return
    if (!campaignName.trim()) return

    mutate(
      {
        client_id: clientId,
        campaign_name: campaignName.trim(),
        spend: num,
        clicks: clicksNum,
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            setCampaignName("")
            setSpend("")
            setClicks("")
            onSuccess?.()
          }
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-2xl bg-card border border-border/60 shadow-xs">
      <div className="space-y-1">
        <h4 className="font-semibold text-sm">Catat Log Ad Spend</h4>
        <p className="text-xs text-muted-foreground">
          Tambah data biaya iklan per campaign.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="campaign-name" className="text-xs font-semibold">
            Nama Campaign
          </Label>
          <Input
            id="campaign-name"
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Contoh: Q4 IG Ads - Pawon Sengon"
            required
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ad-spend" className="text-xs font-semibold">
              Nominal (IDR)
            </Label>
            <Input
              id="ad-spend"
              type="number"
              min="0"
              step="any"
              value={spend}
              onChange={(e) => setSpend(e.target.value)}
              placeholder="500000"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="ad-clicks" className="text-xs font-semibold">
              Klik
            </Label>
            <Input
              id="ad-clicks"
              type="number"
              min="0"
              value={clicks}
              onChange={(e) => setClicks(e.target.value)}
              placeholder="1500"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full admin-pill admin-pill-cobalt">
        {isPending ? (
          <Icons.spinner className="size-4 animate-spin mr-2" />
        ) : (
          <Icons.add className="size-4 mr-2" />
        )}
        Simpan Log
      </Button>
    </form>
  )
}
