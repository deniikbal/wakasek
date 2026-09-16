"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ClipboardListIcon,
  CheckCircle2Icon,
  TrendingUpIcon,
  UsersIcon,
  MailIcon,
  LockIcon,
  UserIcon,
  BookOpenIcon,
  GraduationCapIcon,
  WrenchIcon,
  MegaphoneIcon,
} from "lucide-react"
import { BIDANG_OPTIONS } from "@/lib/constants"

function LoginPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get("redirect") || "/dashboard"

  const [checking, setChecking] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [stats, setStats] = useState({ proker: 0, bidang: 0, terlaksana: 0 })

  useEffect(() => {
    fetch("/api/setup-status")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) router.replace("/dashboard")
        else setChecking(false)
      })
      .catch(() => setChecking(false))

    // Ambil statistik ringan untuk hero
    fetch("/api/public-stats")
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {})
  }, [router])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (needsSetup) {
        const res = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        })
        if (res.error) throw new Error(res.error.message || "Gagal membuat akun")
        router.replace(redirect)
        return
      }

      const res = await authClient.signIn.email({ email, password })
      if (res.error) throw new Error(res.error.message || "Email atau password salah")
      router.replace(redirect)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background">
        <Spinner className="size-6" />
      </main>
    )
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      {/* === HERO KIRI === */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        {/* Pattern dekorasi */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-24 -left-24 size-96 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 size-96 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-2xl" />
        </div>

        <div className="relative z-10 space-y-12">
          {/* Logo & brand */}
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-sm bg-white/15 backdrop-blur">
              <ShieldCheckIcon className="size-5" />
            </div>
            <div>
              <p className="text-base font-bold leading-tight">Portal Wakasek</p>
              <p className="text-xs leading-tight text-white/70">SMAN 1 Bantarujeg</p>
            </div>
          </div>

          {/* Hero copy */}
          <div className="space-y-5">
            <Badge className="bg-white/15 text-white hover:bg-white/20">
              <SparklesIcon className="mr-1 size-3" />
              Sistem Manajemen Wakasek
            </Badge>
            <h1 className="text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
              Kelola program kerja &<br />
              realisasi seluruh bidang<br />
              <span className="text-white/90">dalam satu portal.</span>
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-white/80">
              Platform terpadu untuk merencanakan, memantau, dan melaporkan
              kegiatan Wakil Kepala Sekolah SMAN 1 Bantarujeg.
            </p>
          </div>

          {/* Live stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-sm border border-white/15 bg-white/10 p-3 backdrop-blur">
              <ClipboardListIcon className="size-4 text-white/80" />
              <p className="mt-1.5 text-2xl font-bold leading-tight">
                {stats.proker || 0}
              </p>
              <p className="text-[10px] text-white/70">Program Kerja</p>
            </div>
            <div className="rounded-sm border border-white/15 bg-white/10 p-3 backdrop-blur">
              <UsersIcon className="size-4 text-white/80" />
              <p className="mt-1.5 text-2xl font-bold leading-tight">
                {stats.bidang || 4}
              </p>
              <p className="text-[10px] text-white/70">Bidang</p>
            </div>
            <div className="rounded-sm border border-white/15 bg-white/10 p-3 backdrop-blur">
              <CheckCircle2Icon className="size-4 text-white/80" />
              <p className="mt-1.5 text-2xl font-bold leading-tight">
                {stats.terlaksana || 0}
              </p>
              <p className="text-[10px] text-white/70">Terlaksana</p>
            </div>
          </div>

          {/* Bidang chips */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-white/70">Bidang Wakasek</p>
            <div className="flex flex-wrap gap-1.5">
              {BIDANG_OPTIONS.map((b) => {
                const Icon =
                  b.value === "kurikulum" ? BookOpenIcon :
                  b.value === "kesiswaan" ? GraduationCapIcon :
                  b.value === "sarpras" ? WrenchIcon :
                  MegaphoneIcon
                return (
                  <Badge
                    key={b.value}
                    variant="secondary"
                    className="border border-white/15 bg-white/15 text-white backdrop-blur"
                  >
                    <Icon className="mr-1 size-3" />
                    {b.label}
                  </Badge>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-white/70">
          <span>© {new Date().getFullYear()} SMAN 1 Bantarujeg</span>
          <span>v1.0</span>
        </div>
      </aside>

      {/* === FORM KANAN === */}
      <main className="relative flex flex-col bg-background">
        <div className="flex items-center justify-between px-6 pt-6 sm:px-10">
          <Link
            href="/"
            className="flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeftIcon className="size-3.5" /> Halaman depan
          </Link>
          {/* Logo kecil mobile */}
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <div className="grid size-8 place-items-center rounded-sm bg-primary text-primary-foreground">
              <ShieldCheckIcon className="size-4" />
            </div>
            <span className="text-sm font-bold">Portal Wakasek</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-10">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-1.5">
              <div className="grid size-11 place-items-center rounded-sm bg-primary/10 text-primary">
                <ShieldCheckIcon className="size-5" />
              </div>
              <h1 className="pt-3 text-2xl font-bold tracking-tight">
                {needsSetup ? "Buat Akun Administrator" : "Selamat datang kembali"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {needsSetup
                  ? "Akun pertama akan menjadi administrator sistem."
                  : "Masuk ke portal untuk melanjutkan."}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {needsSetup && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama Wakasek"
                      className="pl-8"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <MailIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="email@sman1bantarujeg.sch.id"
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <LockIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="px-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? "Sembunyi" : "Lihat"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-sm bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
                  <span className="flex-1">{error}</span>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? <Spinner /> : <CheckIcon className="size-4" />}
                {loading
                  ? "Memproses..."
                  : needsSetup
                    ? "Buat Akun & Masuk"
                    : "Masuk"}
              </Button>

              {!needsSetup && (
                <div className="space-y-2 pt-2">
                  <p className="text-center text-xs text-muted-foreground">
                    Belum punya akun?{" "}
                    <span className="font-medium text-foreground">
                      Hubungi admin sekolah.
                    </span>
                  </p>
                </div>
              )}
            </form>

            <div className="rounded-sm border bg-muted/30 p-3">
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheckIcon className="size-3.5 shrink-0 mt-0.5" />
                <span>
                  Akses dilindungi Better Auth. Akun Anda aman dan sesi akan
                  berakhir otomatis setelah tidak aktif.
                </span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}