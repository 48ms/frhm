"use client"

import * as React from "react"
import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number"
import { cn } from "@/lib/utils"

export interface MetricTickerProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: string | number
  decimalSeparator?: string
  thousandSeparator?: string
}

/**
 * MetricTicker parse string metrik seperti "2,500", "4.2%", "105 Posts", "$12.4K"
 * dan menganimasikan bagian angka dengan spring physics rolling number ala Animate UI.
 * Teks non-angka (prefix/suffix) tetap dirender di posisi yang tepat.
 */
export function MetricTicker({
  value,
  decimalSeparator = ".",
  thousandSeparator = ",",
  className,
  ...props
}: MetricTickerProps) {
  const strVal = String(value)
  
  // Pisahkan: prefix non-angka, angka (dengan titik/koma), dan suffix non-angka
  const match = strVal.match(/^([^0-9.-]*)([0-9,.]+)(.*)$/)

  if (!match) {
    return (
      <span className={cn("tabular-nums", className)} {...props}>
        {strVal}
      </span>
    )
  }

  const prefix = match[1]
  const rawNumStr = match[2].replace(/,/g, "")
  const suffix = match[3]
  const numericVal = Number(rawNumStr)

  if (isNaN(numericVal)) {
    return (
      <span className={cn("tabular-nums", className)} {...props}>
        {strVal}
      </span>
    )
  }

  return (
    <span
      className={cn("inline-flex items-baseline tabular-nums", className)}
      {...props}
    >
      <span className="sr-only">{strVal}</span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        {prefix && <span>{prefix}</span>}
        <SlidingNumber
          number={numericVal}
          decimalSeparator={decimalSeparator}
          thousandSeparator={thousandSeparator}
        />
        {suffix && (
          <span
            className={
              suffix.trim() === "%"
                ? "ml-0.5 text-lg font-bold text-foreground"
                : "ml-1.5 text-sm font-semibold text-muted-foreground"
            }
          >
            {suffix.trim()}
          </span>
        )}
      </span>
    </span>
  )
}
