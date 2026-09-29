"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Icons } from '@/components/icons'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export interface ThemePreset {
  id: string
  name: string
  color: string
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "default", name: "Default (Blue)", color: "#2563eb" },
  { id: "supabase", name: "Supabase (Green)", color: "#10b981" },
  { id: "vercel", name: "Vercel (Mono)", color: "#71717a" },
  { id: "claude", name: "Claude (Ochre)", color: "#d97706" },
  { id: "sunset", name: "Sunset (Purple)", color: "#8b5cf6" },
]

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [currentPreset, setCurrentPreset] = React.useState<string>("default")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const savedPreset = localStorage.getItem("frhm-theme-preset") || "default"
    setCurrentPreset(savedPreset)
    document.documentElement.setAttribute("data-theme", savedPreset)
  }, [])

  const applyPreset = (presetId: string) => {
    setCurrentPreset(presetId)
    if (typeof window === "undefined") return
    localStorage.setItem("frhm-theme-preset", presetId)

    const doc = window.document
    const docWithTransition = doc as unknown as { startViewTransition?: (cb: () => void) => void }
    
    if (typeof docWithTransition.startViewTransition === "function") {
      docWithTransition.startViewTransition(() => {
        doc.documentElement.setAttribute("data-theme", presetId)
      })
    } else {
      doc.documentElement.setAttribute("data-theme", presetId)
    }
  }

  const handleModeChange = (newMode: string, e?: React.MouseEvent) => {
    if (typeof window === "undefined") return
    const doc = window.document
    const docWithTransition = doc as unknown as {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> }
    }

    if (typeof docWithTransition.startViewTransition === "function" && e) {
      const x = e.clientX
      const y = e.clientY
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )

      const transition = docWithTransition.startViewTransition(() => {
        setTheme(newMode)
      })

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ]
        doc.documentElement.animate(
          {
            clipPath: newMode === "dark" ? [...clipPath].reverse() : clipPath,
          },
          {
            duration: 400,
            easing: "ease-in-out",
            pseudoElement:
              newMode === "dark"
                ? "::view-transition-old(root)"
                : "::view-transition-new(root)",
          }
        )
      })
    } else {
      setTheme(newMode)
    }
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9 opacity-50" disabled>
        <Icons.palette className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Ubah Tema">
                  <Icons.palette className="h-4 w-4 text-foreground/80 hover:text-foreground" />
                </Button>
              }
            />
          }
        />
        <TooltipContent>Pilih Tema & Tampilan</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
          Preset Warna
        </DropdownMenuLabel>
        {THEME_PRESETS.map((preset) => (
          <DropdownMenuItem
            key={preset.id}
            onClick={() => applyPreset(preset.id)}
            className="flex items-center justify-between text-xs cursor-pointer py-1.5 px-2"
          >
            <div className="flex items-center gap-2">
              <span
                className="size-3 rounded-full border border-border/50 shrink-0"
                style={{ backgroundColor: preset.color }}
              />
              <span className={currentPreset === preset.id ? "font-semibold" : ""}>
                {preset.name}
              </span>
            </div>
            {currentPreset === preset.id && <Icons.check className="size-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="my-1.5" />

        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
          Mode Tampilan
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(val) => handleModeChange(val)}
        >
          <DropdownMenuRadioItem value="light" className="text-xs py-1.5 cursor-pointer">
            <Icons.sun className="mr-2 size-3.5" />
            <span>Light</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="text-xs py-1.5 cursor-pointer">
            <Icons.moon className="mr-2 size-3.5" />
            <span>Dark</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" className="text-xs py-1.5 cursor-pointer">
            <Icons.laptop className="mr-2 size-3.5" />
            <span>System</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
