"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboardIcon,
  ClipboardListIcon,
  CheckCircle2Icon,
  MenuIcon,
  XIcon,
  LogOutIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
} from "lucide-react"
import { cn } from "cn"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/proker", label: "Program Kerja", icon: ClipboardListIcon },
  { href: "/realisasi", label: "Realisasi", icon: CheckCircle2Icon },
]

export function AppShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null; role?: string | null }
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await authClient.signOut()
    router.push("/login")
  }

  const initials = (user.name || user.email || "?")
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("")

  return (
    <div className="flex min-h-svh w-full">
      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r bg-sidebar lg:flex">
        <div className="flex h-14 items-center gap-2.5 border-b px-4">
          <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheckIcon className="size-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight">Portal Wakasek</span>
            <span className="text-[10px] text-muted-foreground leading-tight">SMAN 1 Bantarujeg</span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left outline-none transition-colors hover:bg-sidebar-accent/50">
                  <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {initials}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-xs font-medium">
                      {user.name || user.email}
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground capitalize">
                      {user.role || "user"}
                    </span>
                  </div>
                  <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
                </button>
              }
            />
            <DropdownMenuContent align="start" side="top">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleSignOut} disabled={signingOut}>
                  {signingOut ? <Spinner className="size-4" /> : <LogOutIcon />}
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar — mobile */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <XIcon className="size-4" /> : <MenuIcon className="size-4" />}
            </Button>
            <div className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <ShieldCheckIcon className="size-4" />
            </div>
            <span className="text-sm font-bold">Portal Wakasek</span>
          </div>
        </header>

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute left-0 top-14 h-[calc(100svh-3.5rem)] w-64 border-r bg-sidebar shadow-xl">
              <nav className="flex flex-col gap-1 p-3">
                {NAV_ITEMS.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/")
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
              <div className="mt-auto border-t p-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  {signingOut ? <Spinner /> : <LogOutIcon />}
                  Keluar
                </Button>
              </div>
            </aside>
          </div>
        ) : null}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
