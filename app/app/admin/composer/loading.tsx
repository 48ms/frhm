export default function ComposerLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[hsl(var(--admin-cobalt))] border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-[hsl(var(--admin-outline))]">Memuat Composer...</p>
      </div>
    </div>
  )
}
