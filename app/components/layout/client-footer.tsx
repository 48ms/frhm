import Link from "next/link"

interface ClientFooterProps {
  clientId?: string
  clientName?: string
}

export function ClientFooter({ clientId, clientName }: ClientFooterProps) {
  const queryStr = clientId ? `?clientId=${clientId}` : ""

  return (
    <footer className="mt-auto flex flex-col items-center justify-between gap-4 border-t border-border/30 pt-8 pb-12 text-xs text-muted-foreground sm:flex-row">
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="font-syne text-sm font-bold tracking-tight text-foreground">
            FRHM
          </span>
          <span className="px-2 py-0.5 rounded-full text-2xs font-semibold bg-primary/10 text-primary border border-primary/20">
            Partner Portal
          </span>
        </div>
        <span className="hidden sm:inline text-muted-foreground/50">•</span>
        <span className="text-muted-foreground">
          {clientName ? `Ruang Kolaborasi ${clientName}` : "Creative Media Operations Platform"}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium">
        <Link
          href={`/client/review${queryStr}`}
          className="hover:text-foreground transition-colors cursor-pointer"
        >
          Kebijakan Review & SLA
        </Link>
        <Link
          href={`/client/calendar${queryStr}`}
          className="hover:text-foreground transition-colors cursor-pointer"
        >
          Jadwal Publikasi
        </Link>
        <Link
          href={`/client/support${queryStr}`}
          className="hover:text-foreground transition-colors cursor-pointer"
        >
          Hotline Bantuan
        </Link>
        <div className="flex items-center gap-1.5 text-foreground font-medium">
          <span className="size-2 rounded-full bg-[hsl(var(--admin-lime))] animate-pulse" />
          <span>Sistem Aktif</span>
        </div>
      </div>
    </footer>
  )
}
