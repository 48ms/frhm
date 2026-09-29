'use client'

import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-3 text-center">
        <Icons.warning className="h-8 w-8 text-destructive" />
        <h2 className="text-lg font-semibold">Terjadi kesalahan</h2>
        <p className="text-sm text-muted-foreground">{error.message || 'Gagal memuat data klien.'}</p>
        <Button onClick={reset} size="sm" className="mt-2">
          Coba lagi
        </Button>
      </div>
    </div>
  )
}