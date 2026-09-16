"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { cn } from "cn"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Root>) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Trigger>) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

function DropdownMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Positioner>) {
  return (
    <MenuPrimitive.Positioner
      data-slot="dropdown-menu-content"
      className={cn("z-50 min-w-[8rem]", className)}
      {...props}
    >
      <MenuPrimitive.Popup
        className={cn(
          "relative overflow-hidden rounded-sm border bg-popover p-1 text-popover-foreground shadow-md data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        )}
        {...(props as React.ComponentProps<typeof MenuPrimitive.Popup>)}
      />
    </MenuPrimitive.Positioner>
  )
}

function DropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Item>) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.GroupLabel>) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Separator>) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function DropdownMenuGroup({
  className,
  ...props
}: React.ComponentProps<typeof MenuPrimitive.Group>) {
  return (
    <MenuPrimitive.Group
      data-slot="dropdown-menu-group"
      className={cn("p-1", className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
}
