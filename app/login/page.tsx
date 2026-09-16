"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircleIcon, ArrowLeftIcon, CheckIcon, ShieldCheckIcon } from "lucide-react"

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

  useEffect(() => {
    fetch("/api/setup-status")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) router.replace("/dashboard")
        else setChecking(false)
      })
      .catch(() => setChecking(false))
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
      <main className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" />
      </main>
    )
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-10 lg:order-2 lg:px-14">
        <Link href="/" className="flex w-fit items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-foreground">
          <ArrowLeftIcon className="size-3.5" /> Kembali ke halaman depan
        </Link>

        <div className="flex flex-1 items-center justify-center py-10">
          <form onSubmit={submit} className="w-full max-w-sm space-y-4">
            <div className="space-y-1.5">
              <div className="grid size-11 place-items-center rounded-sm bg-primary/10 text-primary">
                <ShieldCheckIcon className="size-5" />
              </div>
              <h1 className="pt-2 text-xl font-bold tracking-tight">
                {needsSetup ? "Buat Akun Administrator" : "Selamat datang kembali"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {needsSetup ? "Akun pertama akan menjadi administrator sistem." : "Masuk ke portal Wakasek."}
              </p>
            </div>

            {needsSetup ? (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Wakasek" />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@sman1bantarujeg.sch.id" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
            </div>

            {error ? (
              <div className="flex items-center gap-2 rounded-sm bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircleIcon className="size-4 shrink-0" /> {error}
              </div>
            ) : null}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Spinner /> : <CheckIcon />}
              {loading ? "Memproses..." : needsSetup ? "Buat Akun & Masuk" : "Masuk"}
            </Button>

            {!needsSetup ? (
              <p className="text-center text-xs text-muted-foreground">
                Belum punya akun? Hubungi admin sekolah.
              </p>
            ) : null}
          </form>
        </div>
      </div>

      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:order-1 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-sm bg-black/15">
            <ShieldCheckIcon className="size-5" />
          </div>
          <div>
            <p className="text-sm font-bold">Portal Wakasek</p>
            <p className="text-[11px] text-foreground/60">SMAN 1 Bantarujeg</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold leading-tight">
            Sistem manajemen tugas Wakil Kepala Sekolah
          </h2>
          <p className="text-sm text-foreground/80">
            Pantau agenda, disposisi surat, kegiatan sekolah, dan laporan dalam satu portal terpadu.
          </p>
          <ul className="space-y-2 text-sm">
            {["Agenda & jadwal terintegrasi", "Disposisi surat cepat", "Pantau kegiatan sekolah", "Laporan real-time"].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <CheckIcon className="size-4" /> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-xs text-foreground/60">© {new Date().getFullYear()} SMAN 1 Bantarujeg</div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  )
}
