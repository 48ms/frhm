"use client"

import * as React from "react"
import { motion, type Variants } from "motion/react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

export type AnimatedIconName = keyof typeof Icons | string

interface AnimatedIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: AnimatedIconName
  className?: string
  iconClassName?: string
  isActive?: boolean
  animateOnHover?: boolean
}

// Spring physics configuration following Animate UI standards
const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 18,
}

// Tailored micro-interaction variants per semantic icon type
const iconVariants: Record<string, Variants> = {
  rocket: {
    idle: { x: 0, y: 0, rotate: 0, scale: 1 },
    hover: { x: 2.5, y: -2.5, rotate: -10, scale: 1.12, transition: springTransition },
  },
  auto_awesome: {
    idle: { rotate: 0, scale: 1 },
    hover: { rotate: 25, scale: 1.2, transition: springTransition },
  },
  sparkles: {
    idle: { rotate: 0, scale: 1 },
    hover: { rotate: 25, scale: 1.2, transition: springTransition },
  },
  layers: {
    idle: { y: 0, scale: 1 },
    hover: { y: -2.5, scale: 1.1, transition: springTransition },
  },
  hub: {
    idle: { scale: 1, rotate: 0 },
    hover: { scale: 1.15, rotate: 8, transition: springTransition },
  },
  calendar_month: {
    idle: { rotate: 0, scale: 1 },
    hover: { rotate: [-4, 4, 0], scale: 1.1, transition: { duration: 0.35, ease: "easeInOut" } },
  },
  calendar: {
    idle: { rotate: 0, scale: 1 },
    hover: { rotate: [-4, 4, 0], scale: 1.1, transition: { duration: 0.35, ease: "easeInOut" } },
  },
  monitoring: {
    idle: { y: 0, scale: 1 },
    hover: { y: -2, scale: 1.12, transition: springTransition },
  },
  dashboard: {
    idle: { scale: 1, y: 0 },
    hover: { scale: 1.12, y: -1.5, transition: springTransition },
  },
  media: {
    idle: { scale: 1, rotate: 0 },
    hover: { scale: 1.12, rotate: 4, transition: springTransition },
  },
  settings: {
    idle: { rotate: 0, scale: 1 },
    hover: { rotate: 60, scale: 1.1, transition: springTransition },
  },
  bot: {
    idle: { y: 0, scale: 1 },
    hover: { y: -2.5, scale: 1.12, transition: springTransition },
  },
  help: {
    idle: { rotate: 0, scale: 1 },
    hover: { rotate: [0, -10, 10, 0], scale: 1.1, transition: { duration: 0.3 } },
  },
  campaign: {
    idle: { scale: 1, rotate: 0 },
    hover: { scale: 1.15, rotate: -6, transition: springTransition },
  },
  building: {
    idle: { y: 0, scale: 1 },
    hover: { y: -2, scale: 1.1, transition: springTransition },
  },
  mapPin: {
    idle: { y: 0, scale: 1 },
    hover: { y: -3, scale: 1.12, transition: springTransition },
  },
  messageSquare: {
    idle: { scale: 1, rotate: 0 },
    hover: { scale: 1.12, rotate: -4, transition: springTransition },
  },
  add: {
    idle: { rotate: 0, scale: 1 },
    hover: { rotate: 90, scale: 1.15, transition: springTransition },
  },
  // Default fallback for any icon without custom physics
  default: {
    idle: { scale: 1, y: 0 },
    hover: { scale: 1.12, y: -1, transition: springTransition },
  },
}

export function AnimatedIcon({
  name,
  className,
  iconClassName,
  isActive = false,
  animateOnHover = true,
  ...props
}: AnimatedIconProps) {
  const IconCmp = Icons[name as keyof typeof Icons]
  if (!IconCmp) return null

  const selectedVariants = iconVariants[name] ?? iconVariants.default

  return (
    <motion.span
      className={cn("inline-flex items-center justify-center shrink-0 origin-center", className)}
      variants={animateOnHover ? selectedVariants : undefined}
      initial="idle"
      animate={isActive ? "idle" : undefined}
      whileHover={animateOnHover ? "hover" : undefined}
      {...(props as any)}
    >
      <IconCmp className={cn("size-5 transition-colors", iconClassName)} />
    </motion.span>
  )
}
