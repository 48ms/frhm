"use client"

import { Icons } from '@/components/icons'
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <Icons.sun className="h-4 w-4" />
            ) : (
              <Icons.moon className="h-4 w-4" />
            )}
          </Button>
        }
      />
      <TooltipContent>Toggle dark mode</TooltipContent>
    </Tooltip>
  )
}