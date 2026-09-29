import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 shadow-xs focus-visible:border-destructive/40 focus-visible:ring-destructive/30",
        "destructive-outline":
          "border border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 dark:border-destructive/40 dark:hover:bg-destructive/20",
        success:
          "bg-success text-success-foreground hover:bg-success/90 shadow-xs focus-visible:border-success/40 focus-visible:ring-success/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  loading?: boolean
  loadingLabel?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "default",
    size = "default",
    isLoading = false,
    loading = false,
    loadingLabel = "Loading…",
    disabled,
    children,
    ...props
  },
  ref
) {
  const isCurrentlyLoading = isLoading || loading
  const gap = size === "sm" || size === "xs" ? "gap-1" : "gap-1.5"

  return (
    <>
      <ButtonPrimitive
        ref={ref}
        data-slot="button"
        disabled={disabled || isCurrentlyLoading}
        aria-busy={isCurrentlyLoading || undefined}
        className={cn(
          buttonVariants({ variant, size, className }),
          isCurrentlyLoading && "disabled:opacity-100"
        )}
        {...props}
      >
        {isCurrentlyLoading && (
          <Spinner aria-hidden className="absolute inset-0 m-auto" />
        )}
        <span
          className={cn(
            "inline-flex items-center justify-center",
            gap,
            isCurrentlyLoading && "invisible"
          )}
        >
          {children}
        </span>
      </ButtonPrimitive>
      <span role="status" aria-live="polite" className="sr-only">
        {isCurrentlyLoading ? loadingLabel : ""}
      </span>
    </>
  )
})
Button.displayName = "Button"

export { Button, Button as LoadingButton, buttonVariants }
