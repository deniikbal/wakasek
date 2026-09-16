"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboardIcon,
  ClipboardListIcon,
  CheckCircle2Icon,
  MenuIcon,
  XIcon,
  LogOutIcon,
  ShieldCheckIcon,
  UsersIcon,
  ChevronDownIcon,
} from "lucide-react"
import { cn } from "cn"
import { roleLabel } from "@/lib/roles"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/proker", label: "Program Kerja", icon: ClipboardListIcon },
  { href: "/realisasi", label: "Realisasi", icon: CheckCircle2Icon },
  { href: "/users", label: "User", icon: UsersIcon, adminOnly: true },
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
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await authClient.signOut()
    router.push("/login")
  }

  const displayName = user.name || user.email || "Pengguna"
  const initials = displayName
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("")
  const role = user.role || "user"

  const pageTitle =
    NAV_ITEMS.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    )?.label || "Portal Wakasek"

  const navLinks = NAV_ITEMS.filter(
    (item) => !item.adminOnly || role === "admin"
  )

  return (
    <div className="flex min-h-svh w-full">
      {/* Sidebar — navigasi (desktop) */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r bg-sidebar lg:flex">
        <div className="flex h-14 items-center gap-2.5 border-b px-4">
          <div className="grid size-8 place-items-center rounded-sm bg-primary text-primary-foreground">
            <ShieldCheckIcon className="size-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight">Portal Wakasek</span>
            <span className="text-[10px] text-muted-foreground leading-tight">SMAN 1 Bantarujeg</span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navLinks.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/")
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium transition-colors outline-none",
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
      </aside>

      {/* Kolom kanan: navbar atas + konten */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Navbar atas */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background px-4">
          <div className="flex items-center gap-2">
            {/* Hamburger — mobile saja */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu navigasi"
            >
              {mobileOpen ? <XIcon className="size-4" /> : <MenuIcon className="size-4" />}
            </Button>
            <div className="grid size-7 place-items-center rounded-sm bg-primary text-primary-foreground lg:hidden">
              <ShieldCheckIcon className="size-4" />
            </div>
            <span className="text-sm font-semibold lg:text-base">{pageTitle}</span>
          </div>

          {/* Dropdown user */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-sm border px-2 py-1.5 text-sm font-medium outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <div className="grid size-7 shrink-0 place-items-center rounded-sm bg-primary/10 text-xs font-bold text-primary">
                {initials}
              </div>
              <span className="hidden max-w-32 truncate sm:inline">
                {displayName}
              </span>
              <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-sm border bg-popover p-1 text-popover-foreground shadow-md">
                  <div className="flex flex-col gap-0.5 px-2 py-2">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {displayName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                    <Badge
                      variant="secondary"
                      className="mt-1 w-fit px-1.5 text-[10px] font-medium"
                    >
                      {roleLabel(role)}
                    </Badge>
                  </div>
                  <div className="-mx-1 my-1 h-px bg-border" />
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false)
                      handleSignOut()
                    }}
                    disabled={signingOut}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-medium text-destructive outline-none transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  >
                    {signingOut ? (
                      <Spinner className="size-4" />
                    ) : (
                      <LogOutIcon className="size-4" />
                    )}
                    {signingOut ? "Keluar..." : "Keluar"}
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="fixed inset-0 top-14 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full w-64 border-r bg-sidebar shadow-xl">
              <nav className="flex flex-col gap-1 p-3">
                {navLinks.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/")
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
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
            </aside>
          </div>
        ) : null}

        {/* Konten halaman */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
