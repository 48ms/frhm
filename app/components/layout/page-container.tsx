"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { useInfobar, type InfobarContent } from "@/components/ui/infobar"

interface PageContainerProps {
  children: React.ReactNode
  isLoading?: boolean
  pageTitle?: string
  pageDescription?: string
  infoContent?: InfobarContent
  pageHeaderAction?: React.ReactNode
  className?: string
}

function useSafeInfobar() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useInfobar()
  } catch {
    return null
  }
}

export function PageContainer({
  children,
  isLoading,
  pageTitle,
  pageDescription,
  infoContent,
  pageHeaderAction,
  className,
}: PageContainerProps) {
  const infobar = useSafeInfobar()

  React.useEffect(() => {
    if (infoContent && infobar?.setContent) {
      infobar.setContent(infoContent)
    }
  }, [infoContent, infobar])

  const hasHeader = pageTitle || pageHeaderAction

  return (
    <div
      data-slot="page-container"
      className={cn("flex flex-1 flex-col px-4 pt-2 pb-4 md:px-6 md:pt-4", className)}
    >
      {hasHeader && (
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{pageTitle}</h1>
            {pageDescription && (
              <p className="text-muted-foreground text-sm mt-1">{pageDescription}</p>
            )}
          </div>
          {pageHeaderAction && <div className="shrink-0">{pageHeaderAction}</div>}
        </div>
      )}
      {isLoading ? (
        <div role="status" aria-label="Loading page" className="flex flex-1 animate-pulse flex-col gap-4 p-4">
          <div className="bg-muted mb-2 h-8 w-48 rounded" />
          <div className="bg-muted h-4 w-full rounded" />
        </div>
      ) : (
        children
      )}
    </div>
  )
}
