'use client'

import React from 'react'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { AlignJustify, List } from 'lucide-react'

interface DataDensityToggleProps {
  density: 'compact' | 'comfortable'
  onChange: (density: 'compact' | 'comfortable') => void
}

export function DataDensityToggle({ density, onChange }: DataDensityToggleProps) {
  const options = [
    { label: 'Rapat', value: 'compact', icon: <AlignJustify className="h-4 w-4" /> },
    { label: 'Nyaman', value: 'comfortable', icon: <List className="h-4 w-4" /> }
  ]

  return (
    <SegmentedControl 
      options={options}
      value={density}
      onChange={(val) => onChange(val as 'compact' | 'comfortable')}
    />
  )
}
