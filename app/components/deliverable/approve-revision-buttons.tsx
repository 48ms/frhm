'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { CheckIcon, RotateCcwIcon } from 'lucide-react'

interface ApproveRevisionButtonsProps {
  deliverableId: string
  currentStatus: 'sent' | 'approved' | 'revision_requested'
  onApprove: (deliverableId: string) => Promise<void>
  onRequestRevision: (deliverableId: string, reason: string) => Promise<void>
  isLoading?: boolean
}

export function ApproveRevisionButtons({
  deliverableId,
  currentStatus,
  onApprove,
  onRequestRevision,
  isLoading = false,
}: ApproveRevisionButtonsProps) {
  const [showRevisionDialog, setShowRevisionDialog] = useState(false)
  const [revisionReason, setRevisionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      await onApprove(deliverableId)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestRevision = async () => {
    if (!revisionReason.trim()) return
    setSubmitting(true)
    try {
      await onRequestRevision(deliverableId, revisionReason.trim())
      setShowRevisionDialog(false)
      setRevisionReason('')
    } finally {
      setSubmitting(false)
    }
  }

  const isSent = currentStatus === 'sent'

  if (!isSent) return null

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Button
          onClick={handleApprove}
          disabled={submitting || isLoading}
          size="lg"
          className="h-14 text-base sm:text-lg flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {submitting || isLoading ? (
            <>
              <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Memproses...
            </>
          ) : (
            <>
              <CheckIcon className="size-5" />
              Disetujui
            </>
          )}
        </Button>
        <Button
          onClick={() => setShowRevisionDialog(true)}
          disabled={submitting || isLoading}
          variant="destructive"
          size="lg"
          className="h-14 text-base sm:text-lg flex-1"
        >
          {submitting || isLoading ? 'Memproses...' : (
            <>
              <RotateCcwIcon className="size-5" />
              Minta Revisi
            </>
          )}
        </Button>
      </div>

      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Minta Revisi Deliverable</DialogTitle>
            <DialogDescription>
              Berikan alasan mengapa revisi diperlukan. Alasan ini akan dikirim ke admin.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Contoh: Warna brand tidak sesuai, perlu tambahan data pada bagian analisis, format laporan perlu disesuaikan..."
            aria-label="Alasan revisi deliverable"
            value={revisionReason}
            onChange={(e) => setRevisionReason(e.target.value)}
            className="min-h-[120px]"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-11 lg:h-8" onClick={() => setShowRevisionDialog(false)}>
              Batal
            </Button>
            <Button 
              onClick={handleRequestRevision} 
              disabled={!revisionReason.trim() || submitting}
              variant="destructive"
              className="h-11 lg:h-8"
            >
              {submitting ? 'Mengirim...' : 'Kirim Permintaan Revisi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}