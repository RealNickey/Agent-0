import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-neutral-200 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary-500 text-white hover:bg-primary-600 shadow-lg hover:shadow-xl hover:shadow-primary-500/25",
        secondary:
          "border-transparent bg-secondary-500 text-white hover:bg-secondary-600 shadow-lg hover:shadow-xl hover:shadow-secondary-500/25",
        accent:
          "border-transparent bg-accent-500 text-neutral-900 hover:bg-accent-600 shadow-lg hover:shadow-xl hover:shadow-accent-500/25",
        destructive:
          "border-transparent bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl hover:shadow-red-500/25",
        outline: "text-neutral-300 border-neutral-600 hover:bg-neutral-800",
        success:
          "border-transparent bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl hover:shadow-green-500/25",
        warning:
          "border-transparent bg-yellow-500 text-neutral-900 hover:bg-yellow-600 shadow-lg hover:shadow-xl hover:shadow-yellow-500/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }