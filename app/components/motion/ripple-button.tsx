'use client'

import * as React from 'react'
import { motion, type HTMLMotionProps } from "motion/react"
import { cn } from 'cn'
import { buttonVariants } from '@/components/ui/button'
import type { VariantProps } from 'class-variance-authority'

type Ripple = {
  id: number
  x: number
  y: number
}

export type RippleButtonProps = Omit<HTMLMotionProps<'button'>, 'children'> &
  VariantProps<typeof buttonVariants> & {
    hoverScale?: number
    tapScale?: number
    rippleColor?: string
    children?: React.ReactNode
  }

export const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      hoverScale = 1.02,
      tapScale = 0.98,
      rippleColor = 'rgba(255, 255, 255, 0.3)',
      onClick,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = React.useState<Ripple[]>([])
    const buttonRef = React.useRef<HTMLButtonElement>(null)

    React.useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement)

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = buttonRef.current
      if (button) {
        const rect = button.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const newRipple = { id: Date.now(), x, y }
        setRipples((prev) => [...prev, newRipple])

        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== newRipple.id))
        }, 600)
      }

      if (onClick) {
        onClick(e)
      }
    }

    return (
      <motion.button
        ref={buttonRef}
        className={cn(buttonVariants({ variant, size, className }), 'relative overflow-hidden')}
        whileHover={{ scale: hoverScale }}
        whileTap={{ scale: tapScale }}
        onClick={handleClick}
        style={style}
        {...props}
      >
        {children}
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 10, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 20,
              height: 20,
              backgroundColor: rippleColor,
              top: ripple.y - 10,
              left: ripple.x - 10,
            }}
          />
        ))}
      </motion.button>
    )
  }
)
RippleButton.displayName = 'RippleButton'