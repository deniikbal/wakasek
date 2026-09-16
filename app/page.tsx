import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { pool } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ShieldCheckIcon,
  ArrowRightIcon,
  ClipboardListIcon,
  CheckCircle2Icon,
  ClockIcon,
  UsersIcon,
  CalendarDaysIcon,
  MapPinIcon,
} from "lucide-react"
import { bidangLabel, formatBulan, formatRupiah, BIDANG_OPTIONS } from "@/lib/constants"

export const dynamic = "force-dynamic"

async function getLandingData() {
  const now = new Date()
  const bulanIni = now.getMonth() + 1 // 1-12
  const tahunIni = now.getFullYear()

  // Proker di bulan berjalan (bulan_pelaksanaan mengandung bulan ini)
  const prokerBulanIni = await pool.query(
    `SELECT id, bidang, nama_kegiatan, deskripsi, bulan_pelaksanaan,
            penanggung_jawab, anggaran, tahun_ajaran
     FROM proker
     WHERE $1 = ANY(bulan_pelaksanaan)
     ORDER BY bidang, nama_kegiatan`,
    [bulanIni]
  )

  // Statistik ringkasan
  const totalProker = await pool.query(
    `SELECT COUNT(*)::int as total FROM proker`
  )
  const totalAnggaran = await pool.query(
    `SELECT COALESCE(SUM(anggaran), 0)::bigint as total FROM proker`
  )
  const prokerPerBidang = await pool.query(
    `SELECT bidang, COUNT(*)::int as jumlah FROM proker GROUP BY bidang`
  )
  const realisasiTerlaksana = await pool.query(
    `SELECT COUNT(*)::int as total FROM realisasi WHERE status = 'terlaksana'`
  )
  const totalRealisasi = await pool.query(
    `SELECT COUNT(*)::int as total FROM realisasi`
  )

  const namaBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ][bulanIni - 1]

  return {
    prokerBulanIni: prokerBulanIni.rows,
    totalProker: totalProker.rows[0].total,
    totalAnggaran: totalAnggaran.rows[0].total,
    prokerPerBidang: prokerPerBidang.rows,
    realisasiTerlaksana: realisasiTerlaksana.rows[0].total,
    totalRealisasi: totalRealisasi.rows[0].total,
    bulanIni,
    tahunIni,
    namaBulan,
  }
}

export default async function RootPage() {
  const [session, data] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getLandingData(),
  ])

  const isLoggedIn = !!session
  const bidangMap: Record<string, number> = {}
  data.prokerPerBidang.forEach((r: { bidang: string; jumlah: number }) => {
    bidangMap[r.bidang] = r.jumlah
  })
  const capaian = data.totalRealisasi > 0
    ? Math.round((data.realisasiTerlaksana / data.totalRealisasi) * 100)
    : 0

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-sm bg-primary text-primary-foreground">
              <ShieldCheckIcon className="size-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight">Portal Wakasek</span>
              <span className="text-[10px] text-muted-foreground leading-tight">SMAN 1 Bantarujeg</span>
            </div>
          </div>
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button size="sm">
                Dashboard <ArrowRightIcon className="size-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm">
                Masuk <ArrowRightIcon className="size-4" />
              </Button>
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12">
        {/* Hero */}
        <section className="space-y-4 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-sm bg-primary text-primary-foreground">
            <ShieldCheckIcon className="size-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Portal Wakasek
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Sistem manajemen tugas Wakil Kepala Sekolah SMAN 1 Bantarujeg.
            Kelola program kerja dan realisasi seluruh bidang dalam satu platform.
          </p>
        </section>

        {/* Statistik ringkasan */}
        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="grid size-10 place-items-center rounded-sm bg-blue-50">
                <ClipboardListIcon className="size-5 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-tight">{data.totalProker}</span>
                <span className="text-xs text-muted-foreground">Total Program Kerja</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="grid size-10 place-items-center rounded-sm bg-green-50">
                <CheckCircle2Icon className="size-5 text-green-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-tight">{data.realisasiTerlaksana}</span>
                <span className="text-xs text-muted-foreground">Kegiatan Terlaksana</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="grid size-10 place-items-center rounded-sm bg-amber-50">
                <ClockIcon className="size-5 text-amber-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-tight">{capaian}%</span>
                <span className="text-xs text-muted-foreground">Tingkat Capaian</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="grid size-10 place-items-center rounded-sm bg-purple-50">
                <CalendarDaysIcon className="size-5 text-purple-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-tight">{data.prokerBulanIni.length}</span>
                <span className="text-xs text-muted-foreground">Proker Bulan Ini</span>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Proker per bidang */}
        <section className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Program Kerja per Bidang</CardTitle>
              <CardDescription>Distribusi proker di seluruh bidang wakasek</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {BIDANG_OPTIONS.map((b) => {
                  const count = bidangMap[b.value] || 0
                  return (
                    <div key={b.value} className="flex items-center justify-between rounded-sm border p-3">
                      <div className="flex items-center gap-2">
                        <div className={`grid size-8 place-items-center rounded-sm ${b.color.split(" ")[0]}`}>
                          <UsersIcon className="size-4" />
                        </div>
                        <span className="text-sm font-medium">{b.label}</span>
                      </div>
                      <span className="text-lg font-bold">{count}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Proker bulan berjalan */}
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDaysIcon className="size-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">
              Program Kerja {data.namaBulan} {data.tahunIni}
            </h2>
          </div>

          {data.prokerBulanIni.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <ClipboardListIcon className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Belum ada program kerja terjadwal di {data.namaBulan} {data.tahunIni}.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.prokerBulanIni.map((p: {
                id: string
                bidang: string
                nama_kegiatan: string
                deskripsi: string | null
                penanggung_jawab: string
                anggaran: number
                tahun_ajaran: string
              }) => (
                <Card key={p.id} className="flex flex-col">
                  <CardHeader className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline" className={bidangLabel(p.bidang) ? "" : ""}>
                        {bidangLabel(p.bidang)}
                      </Badge>
                    </div>
                    <CardTitle className="text-base leading-snug">
                      {p.nama_kegiatan}
                    </CardTitle>
                    {p.deskripsi && (
                      <CardDescription className="line-clamp-2">
                        {p.deskripsi}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-1.5 border-t pt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <UsersIcon className="size-3.5 shrink-0" />
                      <span className="truncate">{p.penanggung_jawab}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPinIcon className="size-3.5 shrink-0" />
                      <span>T.A. {p.tahun_ajaran}</span>
                    </div>
                    {p.anggaran > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">
                          {formatRupiah(p.anggaran)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Bidang wakasek */}
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold tracking-tight">Bidang Wakasek</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BIDANG_OPTIONS.map((b) => (
              <Card key={b.value}>
                <CardContent className="p-4">
                  <div className={`mb-2 grid size-8 place-items-center rounded-sm ${b.color.split(" ")[0]}`}>
                    <UsersIcon className="size-4" />
                  </div>
                  <h3 className="text-sm font-semibold">{b.label}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {bidangMap[b.value] || 0} program kerja
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted-foreground">
          Portal Wakasek · SMAN 1 Bantarujeg · {data.tahunIni}
        </div>
      </footer>
    </div>
  )
}
