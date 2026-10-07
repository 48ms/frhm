import * as React from "react"
import { cn } from "@/lib/utils"

interface BrandLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number
}

export function BrandLogo({ className, size = 32, ...props }: BrandLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      className={cn("shrink-0", className)}
      {...props}
    >
      {/* F (Blue) */}
      <path
        d="M 24 28 C 24 25, 48 24, 48 30 C 48 34, 38 35, 34 38 C 42 39, 44 43, 37 46 C 33 48, 27 52, 24 44 Z"
        fill="#2563EB"
      />
      <circle cx="28" cy="34" r="2.5" fill="#ffffff" opacity="0.8" />

      {/* R (Red) */}
      <path
        d="M 43 36 C 41 30, 60 27, 63 35 C 65 40, 56 42, 53 45 C 58 50, 66 50, 63 56 C 58 56, 49 48, 44 48 Z"
        fill="#EF4444"
      />
      <circle cx="53" cy="35" r="2" fill="#ffffff" opacity="0.8" />

      {/* H (Green) */}
      <path
        d="M 26 53 C 24 53, 27 68, 28 72 C 30 75, 36 74, 37 67 C 38 64, 41 64, 42 67 C 43 72, 47 72, 48 65 C 49 57, 43 53, 41 59 C 40 60, 36 60, 35 56 C 34 52, 28 51, 26 53 Z"
        fill="#10B981"
      />
      <circle cx="31" cy="62" r="2" fill="#ffffff" opacity="0.8" />

      {/* M (Yellow/Orange) */}
      <path
        d="M 52 50 C 50 50, 56 68, 59 72 C 62 76, 68 74, 71 67 C 73 62, 77 62, 79 67 C 81 72, 87 72, 88 65 C 89 57, 82 50, 77 56 C 75 58, 71 58, 68 53 C 65 48, 55 47, 52 50 Z"
        fill="#F59E0B"
      />
      <circle cx="63" cy="61" r="2.5" fill="#ffffff" opacity="0.8" />
    </svg>
  )
}
