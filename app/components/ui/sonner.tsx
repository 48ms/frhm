'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Toaster as SonnerToaster } from 'sonner'

type ToasterProps = React.ComponentProps<typeof SonnerToaster>

export function Toaster({ ...props }: ToasterProps) {
  const { theme = 'system' } = useTheme()

  return (
    <SonnerToaster
      theme={theme as ToasterProps['theme']}
      position="top-right"
      richColors
      closeButton
      className="toaster group"
      toastOptions={{
        duration: 3500,
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border/60 group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl group-[.toaster]:font-sans text-xs',
          description: 'group-[.toast]:text-muted-foreground text-2xs',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:font-semibold text-2xs rounded-xl',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground text-2xs rounded-xl',
          closeButton:
            'group-[.toast]:bg-card group-[.toast]:border-border/60 group-[.toast]:text-muted-foreground hover:group-[.toast]:text-foreground',
        },
        style: {
          background: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          borderColor: 'hsl(var(--border))',
        },
      }}
      {...props}
    />
  )
}

