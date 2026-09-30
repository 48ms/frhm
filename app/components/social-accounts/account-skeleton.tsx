import { cn } from "@/lib/utils"

export function AccountSkeleton() {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-2xl border border-white/80",
        "bg-[hsl(var(--admin-surface-low))]/60 shadow-sm"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-[hsl(var(--admin-outline-variant))]/40 animate-pulse" />
        <div className="space-y-2">
          <div className="w-20 h-3 rounded bg-[hsl(var(--admin-outline-variant))]/40 animate-pulse" />
          <div className="w-28 h-2.5 rounded bg-[hsl(var(--admin-outline-variant))]/30 animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-14 h-5 rounded-full bg-[hsl(var(--admin-outline-variant))]/40 animate-pulse" />
        <div className="w-6 h-6 rounded-full bg-[hsl(var(--admin-outline-variant))]/30 animate-pulse" />
        <div className="w-6 h-6 rounded-full bg-[hsl(var(--admin-outline-variant))]/30 animate-pulse" />
      </div>
    </div>
  )
}
