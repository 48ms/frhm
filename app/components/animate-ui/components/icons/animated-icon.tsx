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
    active: { scale: 1.08, rotate: -4, transition: springTransition },
    hover: { x: 2.5, y: -2.5, rotate: -12, scale: 1.18, transition: springTransition },
  },
  auto_awesome: {
    idle: { rotate: 0, scale: 1 },
    active: { scale: 1.1, rotate: 8, transition: springTransition },
    hover: { rotate: 30, scale: 1.25, transition: springTransition },
  },
  sparkles: {
    idle: { rotate: 0, scale: 1 },
    active: { scale: 1.1, rotate: 8, transition: springTransition },
    hover: { rotate: 30, scale: 1.25, transition: springTransition },
  },
  layers: {
    idle: { y: 0, scale: 1 },
    active: { y: -1, scale: 1.08, transition: springTransition },
    hover: { y: -3, scale: 1.16, transition: springTransition },
  },
  hub: {
    idle: { scale: 1, rotate: 0 },
    active: { scale: 1.08, rotate: 4, transition: springTransition },
    hover: { scale: 1.18, rotate: 12, transition: springTransition },
  },
  calendar_month: {
    idle: { rotate: 0, scale: 1 },
    active: { scale: 1.06, rotate: 2, transition: springTransition },
    hover: { rotate: [-6, 6, -3, 3, 0], scale: 1.15, transition: { duration: 0.45, ease: "easeInOut" } },
  },
  calendar: {
    idle: { rotate: 0, scale: 1 },
    active: { scale: 1.06, rotate: 2, transition: springTransition },
    hover: { rotate: [-6, 6, -3, 3, 0], scale: 1.15, transition: { duration: 0.45, ease: "easeInOut" } },
  },
  monitoring: {
    idle: { y: 0, scale: 1 },
    active: { y: -1, scale: 1.08, transition: springTransition },
    hover: { y: -3, scale: 1.16, transition: springTransition },
  },
  dashboard: {
    idle: { scale: 1, y: 0 },
    active: { scale: 1.08, y: -1, transition: springTransition },
    hover: { scale: 1.16, y: -2.5, transition: springTransition },
  },
  media: {
    idle: { scale: 1, rotate: 0 },
    active: { scale: 1.06, rotate: 3, transition: springTransition },
    hover: { scale: 1.16, rotate: 8, transition: springTransition },
  },
  settings: {
    idle: { rotate: 0, scale: 1 },
    active: { scale: 1.08, rotate: 20, transition: springTransition },
    hover: { rotate: 90, scale: 1.18, transition: springTransition },
  },
  bot: {
    idle: { y: 0, scale: 1 },
    active: { y: -1, scale: 1.08, transition: springTransition },
    hover: { y: -3, scale: 1.16, transition: springTransition },
  },
  help: {
    idle: { rotate: 0, scale: 1 },
    active: { scale: 1.06, transition: springTransition },
    hover: { rotate: [0, -12, 12, 0], scale: 1.15, transition: { duration: 0.35 } },
  },
  campaign: {
    idle: { scale: 1, rotate: 0 },
    active: { scale: 1.08, rotate: -4, transition: springTransition },
    hover: { scale: 1.2, rotate: -10, transition: springTransition },
  },
  building: {
    idle: { y: 0, scale: 1 },
    active: { y: -1, scale: 1.06, transition: springTransition },
    hover: { y: -2.5, scale: 1.15, transition: springTransition },
  },
  mapPin: {
    idle: { y: 0, scale: 1 },
    active: { y: -1.5, scale: 1.08, transition: springTransition },
    hover: { y: -4, scale: 1.2, transition: springTransition },
  },
  messageSquare: {
    idle: { scale: 1, rotate: 0 },
    active: { scale: 1.06, rotate: -2, transition: springTransition },
    hover: { scale: 1.16, rotate: -6, transition: springTransition },
  },
  add: {
    idle: { rotate: 0, scale: 1 },
    active: { scale: 1.08, rotate: 45, transition: springTransition },
    hover: { rotate: 90, scale: 1.2, transition: springTransition },
  },
  arrowRight: {
    idle: { x: 0, scale: 1 },
    active: { x: 1, scale: 1.05, transition: springTransition },
    hover: { x: 3.5, scale: 1.15, transition: springTransition },
  },
  // Default fallback for any icon without custom physics
  default: {
    idle: { scale: 1, y: 0 },
    active: { scale: 1.06, y: -0.5, transition: springTransition },
    hover: { scale: 1.15, y: -2, transition: springTransition },
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
      className={cn("inline-flex items-center justify-center shrink-0 origin-center select-none", className)}
      variants={animateOnHover ? selectedVariants : undefined}
      initial={false}
      animate={isActive ? "active" : "idle"}
      whileHover={animateOnHover ? "hover" : undefined}
      whileTap={{ scale: 0.92 }}
      transition={springTransition}
      {...(props as any)}
    >
      <IconCmp className={cn("size-5 transition-colors", iconClassName)} />
    </motion.span>
  )
}
