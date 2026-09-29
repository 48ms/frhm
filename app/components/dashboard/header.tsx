import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { ScheduleModal } from "@/components/dashboard/schedule-modal"

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-lum-outline-variant/30 bg-lum-surface-lowest/90 px-6 py-3 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <span className="font-display text-xl font-extrabold tracking-tight text-lum-on-surface">
            FRHM
          </span>
          <span className="inline-flex items-center rounded-full bg-lum-primary-container px-2 py-0.5 text-[10px] font-bold text-lum-on-primary-container">
            STUDIO
          </span>
        </div>

        {/* Global search */}
        <div className="relative hidden w-72 transition-all focus-within:w-80 sm:block">
          <Icons.search className="absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-lum-outline" />
          <input
            type="text"
            placeholder="Search campaigns, tags, client assets..."
            className="h-9 w-full rounded-full border border-lum-outline-variant/40 bg-lum-surface-low pl-10 pr-4 text-xs text-lum-on-surface shadow-inner outline-none transition-all placeholder:text-lum-outline/70 focus:border-lum-cobalt focus:ring-1 focus:ring-lum-cobalt"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="hidden rounded-full border-lum-outline-variant/50 bg-lum-surface-lowest text-xs font-semibold text-lum-on-surface hover:bg-lum-surface-high lg:flex"
        >
          <Icons.upload className="mr-1.5 size-4" />
          Quick Export
        </Button>
        <ScheduleModal
          trigger={
            <Button
              size="sm"
              className="rounded-full bg-lum-primary-container text-xs font-bold text-lum-on-primary-container shadow-sm hover:bg-lum-primary-container/80 hover:shadow-[0_8px_20px_-3px_rgba(212,255,50,0.5)]"
            >
              <Icons.add className="mr-1.5 size-4" />
              Create Campaign
            </Button>
          }
        />
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-full p-2 text-lum-on-surface transition-all hover:bg-lum-surface-high"
        >
          <Icons.notifications className="size-5" />
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-lum-cobalt" />
        </button>
      </div>
    </header>
  )
}
