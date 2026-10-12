"use client"

import * as React from "react"
import { ShimmeringText as ShimmeringTextPrimitive, type ShimmeringTextProps } from "@/components/animate-ui/primitives/texts/shimmering"
import { cn } from "@/lib/utils"

export function ShimmeringText({ className, ...props }: ShimmeringTextProps) {
  return (
    <ShimmeringTextPrimitive
      className={cn("font-medium", className)}
      color="var(--foreground)"
      shimmeringColor="hsl(var(--admin-cobalt))"
      {...props}
    />
  )
}

export type { ShimmeringTextProps }
