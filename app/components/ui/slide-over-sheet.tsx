'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from "motion/react"
import { Icons } from '@/components/icons'

interface SlideOverSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export function SlideOverSheet({ isOpen, onClose, title, children }: SlideOverSheetProps) {
  // Prevent scrolling when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop (Dimmed background) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Slide-over panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background/95 backdrop-blur-xl shadow-2xl flex flex-col sm:border-l border-border/30"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/30">
              <h2 className="text-lg font-bold tracking-tight text-foreground">{title || 'Details'}</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <Icons.close className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
