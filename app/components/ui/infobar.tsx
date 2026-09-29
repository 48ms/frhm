"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Icons } from '@/components/icons'

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

const INFOBAR_WIDTH = "22rem"
const INFOBAR_KEYBOARD_SHORTCUT = "i"

export type HelpfulLink = {
  title: string
  url: string
}

export type DescriptiveSection = {
  title: string
  description: string
  links?: HelpfulLink[]
}

export type InfobarContent = {
  title: string
  sections: DescriptiveSection[]
}

type InfobarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleInfobar: () => void
  content: InfobarContent | null
  setContent: (content: InfobarContent | null) => void
}

const InfobarContext = React.createContext<InfobarContextProps | null>(null)

export function useInfobar() {
  const context = React.useContext(InfobarContext)
  if (!context) {
    throw new Error("useInfobar must be used within a InfobarProvider.")
  }
  return context
}

export function InfobarProvider({
  defaultOpen = false,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)
  const [content, setContent] = React.useState<InfobarContent | null>(null)
  const pathname = usePathname()

  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (isMobile) setOpenMobile(openState)
      if (setOpenProp) setOpenProp(openState)
      else _setOpen(openState)
    },
    [setOpenProp, open, isMobile],
  )

  const toggleInfobar = React.useCallback(() => {
    setOpen((prev) => !prev)
  }, [setOpen])

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== INFOBAR_KEYBOARD_SHORTCUT || !(event.metaKey || event.ctrlKey)) return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return
      }
      event.preventDefault()
      toggleInfobar()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleInfobar])

  React.useEffect(() => {
    setOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close on route change only
  }, [pathname])

  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<InfobarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleInfobar,
      content,
      setContent,
    }),
    [state, open, setOpen, isMobile, openMobile, toggleInfobar, content],
  )

  return (
    <InfobarContext.Provider value={contextValue}>
      <div
        data-slot="infobar-wrapper"
        style={
          {
            "--infobar-width": INFOBAR_WIDTH,
            ...style,
          } as React.CSSProperties
        }
        className={cn("group/infobar-wrapper flex w-full flex-1", className)}
        {...props}
      >
        {children}
      </div>
    </InfobarContext.Provider>
  )
}

export function Infobar({
  side = "right",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
}) {
  const { isMobile, state, setOpen, openMobile, setOpenMobile } = useInfobar()

  if (isMobile) {
    return (
      <Sheet
        open={openMobile}
        onOpenChange={(value) => {
          setOpenMobile(value)
          setOpen(value)
        }}
      >
        <SheetContent
          side={side}
          className="w-[22rem] p-0 [&>button]:hidden"
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Infobar</SheetTitle>
            <SheetDescription>Panel bantuan admin</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="group peer text-sidebar-foreground relative hidden md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? "offcanvas" : ""}
      data-side={side}
      data-slot="infobar"
    >
      <div
        data-slot="infobar-container"
        className={cn(
          "sticky top-0 z-30 hidden h-[calc(100dvh-3.5rem)] w-(--infobar-width) shrink-0 overflow-hidden rounded-tl-xl border-l border-t transition-[width,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:flex",
          "group-data-[collapsible=offcanvas]:w-0 group-data-[collapsible=offcanvas]:overflow-hidden group-data-[collapsible=offcanvas]:border-0 group-data-[collapsible=offcanvas]:opacity-0",
          className,
        )}
        {...props}
      >
        <div className="bg-sidebar text-sidebar-foreground flex h-full w-full flex-col overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

export function InfobarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const context = React.useContext(InfobarContext)
  if (!context) return null

  const { toggleInfobar } = context

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-9", className)}
      aria-label="Toggle info panel"
      onClick={(event) => {
        onClick?.(event)
        toggleInfobar()
      }}
      {...props}
    >
      <Icons.chevronsRight className="size-4" />
    </Button>
  )
}

export function InfobarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2 p-2", className)} {...props} />
}

export function InfobarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto", className)} {...props} />
  )
}

export function InfobarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("relative flex w-full min-w-0 flex-col p-2", className)} {...props} />
}

export function InfobarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("w-full text-sm", className)} {...props} />
}

export function InfobarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleInfobar } = useInfobar()
  return (
    <button
      type="button"
      aria-label="Toggle Infobar"
      tabIndex={-1}
      onClick={toggleInfobar}
      title="Toggle Infobar"
      className={cn("sr-only", className)}
      {...props}
    />
  )
}
