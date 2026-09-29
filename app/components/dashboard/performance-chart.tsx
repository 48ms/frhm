const TIMEFRAMES = ["7D", "30D", "90D"] as const

export function DashboardPerformanceChart() {
  return (
    <div className="rounded-2xl border border-white/80 bg-lum-surface-lowest/85 p-6 shadow-sm backdrop-blur-xl">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <span className="block text-xs font-bold tracking-wider text-lum-outline">
            AUDIENCE TRAJECTORY
          </span>
          <h2 className="font-display text-lg font-bold text-lum-on-surface">
            Performance &amp; Engagement Dynamics
          </h2>
        </div>
        <div className="inline-flex rounded-full border border-lum-outline-variant/30 bg-lum-surface-high/70 p-1">
          {TIMEFRAMES.map((tf, i) => (
            <span
              key={tf}
              className={
                i === 0
                  ? "rounded-full bg-lum-surface-lowest px-3 py-1 text-xs font-semibold text-lum-on-surface shadow-sm"
                  : "px-3 py-1 text-xs font-semibold text-lum-outline"
              }
            >
              {tf}
            </span>
          ))}
        </div>
      </div>

      <div className="group relative flex h-60 w-full cursor-crosshair flex-col justify-between overflow-hidden rounded-2xl border border-white/50 bg-lum-surface-low/40 p-4">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-70 transition-opacity group-hover:opacity-90">
          <svg className="size-full" preserveAspectRatio="none" viewBox="0 0 600 200">
            <defs>
              <linearGradient id="grad-wave" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4353FF" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#D4FF32" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,160 C80,140 140,50 220,90 C300,130 380,30 460,70 C540,110 580,20 600,40 L600,200 L0,200 Z"
              fill="url(#grad-wave)"
            />
            <path
              d="M0,160 C80,140 140,50 220,90 C300,130 380,30 460,70 C540,110 580,20 600,40"
              fill="none"
              stroke="#2333E7"
              strokeLinecap="round"
              strokeWidth="3"
            />
            <path
              d="M0,180 C90,160 160,110 240,130 C320,150 400,90 480,100 C550,110 580,80 600,90"
              fill="none"
              stroke="#aed500"
              strokeDasharray="4 4"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs font-medium text-lum-outline">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-lum-cobalt" /> Impressions (Reach)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full border border-lum-primary-deep bg-lum-primary-container" />
            Click Through &amp; Saves
          </span>
          <span className="rounded-full bg-lum-surface-lowest px-2.5 py-0.5 font-bold text-lum-primary-deep shadow-sm">
            Peak: Friday +34%
          </span>
        </div>

        <div className="relative z-20 flex items-center gap-2 self-center rounded-full border border-white bg-lum-surface-lowest/95 px-4 py-1.5 text-xs shadow-lg backdrop-blur-md">
          <span className="size-2 animate-ping rounded-full bg-lum-cobalt-light" />
          <span className="font-display font-bold text-lum-on-surface">248.5K</span>
          <span className="text-lum-outline">Interactions at 18:00</span>
        </div>

        <div className="relative z-10 flex justify-between border-t border-lum-outline-variant/30 pt-2 text-xs font-medium text-lum-outline">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span className="font-bold text-lum-primary-deep">Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-xl border border-white/60 bg-lum-surface-low/60 p-3.5 transition-all hover:bg-lum-surface-lowest">
          <p className="text-[10px] font-bold tracking-wider text-lum-outline">
            TOP PERFORMING FORMAT
          </p>
          <p className="mt-1 font-display text-base font-bold text-lum-on-surface">Short Reels</p>
          <p className="mt-0.5 text-xs font-semibold text-lum-primary-deep">
            8.4x retention multiplier
          </p>
        </div>
        <div className="rounded-xl border border-white/60 bg-lum-surface-low/60 p-3.5 transition-all hover:bg-lum-surface-lowest">
          <p className="text-[10px] font-bold tracking-wider text-lum-outline">
            VIRAL DRIFT SCORE
          </p>
          <p className="mt-1 font-display text-base font-bold text-lum-on-surface">94 / 100</p>
          <p className="mt-0.5 text-xs font-semibold text-lum-cobalt">
            Algorithmic favoritism high
          </p>
        </div>
        <div className="rounded-xl border border-white/60 bg-lum-surface-low/60 p-3.5 transition-all hover:bg-lum-surface-lowest">
          <p className="text-[10px] font-bold tracking-wider text-lum-outline">
            AUDIENCE REACTION
          </p>
          <p className="mt-1 font-display text-base font-bold text-lum-on-surface">
            98.2% Positive
          </p>
          <p className="mt-0.5 text-xs font-bold text-lum-on-primary-container">Sentiment peak</p>
        </div>
      </div>
    </div>
  )
}
