import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-sm border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 transition outline-none",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary border-transparent",
        secondary: "bg-muted text-muted-foreground border-transparent",
        outline: "text-foreground border-border",
        destructive: "bg-destructive/10 text-destructive border-transparent",
        success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-transparent",
        warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
