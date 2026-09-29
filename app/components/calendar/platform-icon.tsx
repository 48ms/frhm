// Brand SVG logos for platforms.
// Paths are defined as static data so the component stays a thin lookup
// (no long if/else chain) and is trivial to extend with new platforms.

type IconDef = {
  viewBox: string
  /** `stroke` icons use stroke rendering, otherwise fill. */
  mode: 'stroke' | 'fill'
  paths: string[]
  rect?: { x: number; y: number; width: number; height: number; rx: number; ry: number }
  circle?: { cx: number; cy: number; r: number }
  line?: { x1: number; y1: number; x2: number; y2: number }
}

const ICONS: Record<string, IconDef> = {
  instagram: {
    viewBox: '0 0 24 24',
    mode: 'stroke',
    rect: { x: 2, y: 2, width: 20, height: 20, rx: 5, ry: 5 },
    paths: ['M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z'],
    line: { x1: 17.5, y1: 6.5, x2: 17.51, y2: 6.5 },
  },
  tiktok: {
    viewBox: '0 0 24 24',
    mode: 'fill',
    paths: ['M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V5.8a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 3 12a6.34 6.34 0 0 0 10.86 4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.86z'],
  },
  linkedin: {
    viewBox: '0 0 24 24',
    mode: 'fill',
    paths: ['M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z'],
  },
  youtube: {
    viewBox: '0 0 24 24',
    mode: 'fill',
    paths: ['M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'],
  },
  facebook: {
    viewBox: '0 0 24 24',
    mode: 'fill',
    paths: ['M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'],
  },
  x: {
    viewBox: '0 0 24 24',
    mode: 'fill',
    paths: ['M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'],
  },
}

const FALLBACK = ICONS.x

export function PlatformIcon({ platform, className = 'size-4' }: { platform: string; className?: string }) {
  const def = ICONS[platform.toLowerCase()] ?? FALLBACK

  return (
    <svg
      className={className}
      viewBox={def.viewBox}
      fill={def.mode === 'fill' ? 'currentColor' : 'none'}
      {...(def.mode === 'stroke'
        ? { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
        : {})}
    >
      {def.rect && <rect {...def.rect} />}
      {def.paths.map((d) => (
        <path key={d} d={d} />
      ))}
      {def.line && <line {...def.line} />}
    </svg>
  )
}
