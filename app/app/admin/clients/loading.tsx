import { Icons } from '@/components/icons'

export default function Loading() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Icons.spinner className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Memuat data klien…</p>
      </div>
    </div>
  )
}