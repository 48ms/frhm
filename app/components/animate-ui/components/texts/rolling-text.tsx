"use client"

import * as React from "react"
import { RollingText as RollingTextPrimitive, type RollingTextProps } from "@/components/animate-ui/primitives/texts/rolling"
import { cn } from "@/lib/utils"

export function RollingText({ className, ...props }: RollingTextProps) {
  return (
    <RollingTextPrimitive
      className={cn("font-medium", className)}
      inView={true}
      {...props}
    />
  )
}

export type { RollingTextProps }
