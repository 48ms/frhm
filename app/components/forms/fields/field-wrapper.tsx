import * as React from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface FieldWrapperProps {
  id?: string
  label?: string
  description?: string
  error?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

export function FieldWrapper({
  id,
  label,
  description,
  error,
  required,
  className,
  children,
}: FieldWrapperProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={id} className="text-xs font-medium text-foreground flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
      )}
      {children}
      {description && !error && (
        <p className="text-[11px] text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-[11px] font-medium text-destructive animate-in fade-in-50">
          {error}
        </p>
      )}
    </div>
  )
}
