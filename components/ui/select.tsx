"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { cn } from "cn"
import { ChevronDownIcon } from "lucide-react"

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-sm border border-input bg-input/20 px-2 py-0.5 text-sm transition-colors outline-none hover:bg-input/30 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        size === "default" ? "h-7" : "h-6 text-xs",
        className
      )}
      {...props}
    />
  )
}

function SelectValue({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("min-w-0 flex-1 text-left text-sm", className)}
      {...props}
    />
  )
}

function SelectContent({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Positioner>) {
  return (
    <SelectPrimitive.Positioner
      data-slot="select-content"
      className={cn(
        "z-50 min-w-[var(--trigger-width)] data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        className
      )}
      {...props}
    >
      <SelectPrimitive.Popup
        className={cn(
          "relative max-h-[var(--available-height)] min-w-[8rem] overflow-hidden rounded-sm border bg-popover p-1 text-popover-foreground shadow-md data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
          className
        )}
        {...(props as React.ComponentProps<typeof SelectPrimitive.Popup>)}
      />
    </SelectPrimitive.Positioner>
  )
}

function SelectItem({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm py-1 pl-2 pr-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    />
  )
}

function SelectIcon({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Icon>) {
  return (
    <SelectPrimitive.Icon
      data-slot="select-icon"
      className={cn("opacity-50", className)}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.Icon>
  )
}

function SelectPortal({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Portal>) {
  return <SelectPrimitive.Portal {...props} />
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectIcon,
  SelectPortal,
}
