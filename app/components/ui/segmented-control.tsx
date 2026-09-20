'use client'

import React, { useState } from 'react'
import { motion } from "motion/react"

interface Option {
  label: string
  value: string
}

interface SegmentedControlProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div className="flex bg-muted p-1 rounded-xl w-fit relative">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`relative px-4 py-1.5 text-sm font-medium rounded-lg transition-colors z-10 ${
            value === option.value ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {value === option.value && (
            <motion.div
              layoutId="segmented-control-active"
              className="absolute inset-0 bg-background shadow-sm rounded-lg -z-10"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          {option.label}
        </button>
      ))}
    </div>
  )
}
