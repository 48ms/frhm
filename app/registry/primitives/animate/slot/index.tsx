"use client"

import * as React from "react"
import { Slot as RadixSlot } from "@radix-ui/react-slot"

export type SlotProps = React.ComponentPropsWithoutRef<typeof RadixSlot>

export const Slot = React.forwardRef<HTMLElement, SlotProps>(
  (props, ref) => {
    return <RadixSlot ref={ref} {...props} />
  }
)
Slot.displayName = "Slot"