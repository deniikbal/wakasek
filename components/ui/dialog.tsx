"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "cn"
import { XIcon } from "lucide-react"

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal {...props} />
}

function DialogBackdrop({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Backdrop>) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Popup>) {
  return (
    <DialogPortal>
      <DialogBackdrop />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed left-[50%] top-[50%] z-50 flex w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] flex-col gap-4 rounded-sm border bg-card p-6 shadow-lg outline-none data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-sm p-1 opacity-70 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/30"
          aria-label="Tutup"
        >
          <XIcon className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5 pr-6", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
}
