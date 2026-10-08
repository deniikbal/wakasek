"use client"

import { forwardRef, useState } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// Input password dengan toggle icon eye (lihat/sembunyi)
const PasswordInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { icon?: React.ReactNode }
>(({ className, type, icon, ...props }, ref) => {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      {icon ? (
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
      ) : null}
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn(icon && "pl-8", "pr-9", className)}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Sembunyikan password" : "Lihat password"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
      >
        {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      </button>
    </div>
  )
})
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }