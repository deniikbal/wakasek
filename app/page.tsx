import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { pool } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  ShieldCheckIcon,
  ArrowRightIcon,
  ClipboardListIcon,
  CheckCircle2Icon,
  ClockIcon,
  UsersIcon,
  CalendarDaysIcon,
  WalletIcon,
  TargetIcon,
  TrendingUpIcon,
  SparklesIcon,
  BookOpenIcon,
  GraduationCapIcon,
  WrenchIcon,
  MegaphoneIcon,
  ChevronRightIcon,
  ActivityIcon,
} from "lucide-react"
import {
  bidangLabel,
  formatRupiah,
  BIDANG_OPTIONS,
  BULAN_SINGKAT,
} from "@/lib/constants"

export const dynamic = "force-dynamic"

async function getLandingData() {
  const now = new Date()
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const [prokerBulanIni, totalProker, totalAnggaran, prokerPerBidang, statistikRealisasi, upcoming, proker12Bulan] = await Promise.all([
    // Proker di bulan ini
    pool.query(
      `SELECT id, bidang, nama_kegiatan, deskripsi, penanggung_jawab,
              anggaran, tahun_ajaran
       FROM proker
       WHERE $1 = ANY(bulan_pelaksanaan)
       ORDER BY bidang, nama_kegiatan`,
      [bulanIni]
    ),
    // Total proker
    pool.query(`SELECT COUNT(*)::int as total FROM proker`),
    // Total anggaran
    pool.query(`SELECT COALESCE(SUM(anggaran), 0)::bigint as total FROM proker`),
    // Per bidang
    pool.query(`SELECT bidang, COUNT(*)::int as jumlah FROM proker GROUP BY bidang`),
    // Statistik realisasi
    pool.query(`
      SELECT status, COUNT(*)::int as jumlah
      FROM realisasi
      GROUP BY status
    `),
    // Upcoming 3 proker bulan depan
    pool.query(
      `SELECT id, bidang, nama_kegiatan, bulan_pelaksanaan, tahun_ajaran
       FROM proker
       WHERE $1 = ANY(bulan_pelaksanaan) AND $1 > 0
       ORDER BY created_at DESC
       LIMIT 3`,
      [bulanIni === 12 ? 1 : bulanIni + 1]
    ),
    // Distribusi per bulan (1-12) tahun ini
    pool.query(
      `SELECT
         UNNEST(bulan_pelaksanaan) as bulan,
         COUNT(*)::int as jumlah
       FROM proker
       GROUP BY bulan
       ORDER BY bulan`
    ),
  ])

  const statusMap: Record<string, number> = {}
  statistikRealisasi.rows.forEach((r: { status: string; jumlah: number }) => {
    statusMap[r.status] = r.jumlah
  })

  const namaBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ][bulanIni - 1]

  // Bangun array 12 bulan untuk chart
  const bulanChart: { bulan: number; label: string; jumlah: number }[] = []
  for (let i = 1; i <= 12; i++) {
    const found = proker12Bulan.rows.find((r: { bulan: number; jumlah: number }) => r.bulan === i)
    bulanChart.push({
      bulan: i,
      label: BULAN_SINGKAT[i - 1],
      jumlah: found?.jumlah || 0,
    })
  }

  return {
    prokerBulanIni: prokerBulanIni.rows,
    totalProker: totalProker.rows[0].total,
    totalAnggaran: Number(totalAnggaran.rows[0].total),
    prokerPerBidang: prokerPerBidang.rows,
    statusMap,
    namaBulan,
    bulanIni,
    tahunIni,
    upcoming: upcoming.rows,
    bulanChart,
  }
}

const BIDANG_ICONS: Record<string, typeof BookOpenIcon> = {
  kurikulum: BookOpenIcon,
  kesiswaan: GraduationCapIcon,
  sarpras: WrenchIcon,
  humas: MegaphoneIcon,
}

const BIDANG_GRADIENT: Record<string, string> = {
  kurikulum: "from-blue-500/10 to-blue-500/5 border-blue-200/50",
  kesiswaan: "from-purple-500/10 to-purple-500/5 border-purple-200/50",
  sarpras: "from-emerald-500/10 to-emerald-500/5 border-emerald-200/50",
  humas: "from-orange-500/10 to-orange-500/5 border-orange-200/50",
}

const BIDANG_TEXT: Record<string, string> = {
  kurikulum: "text-blue-700",
  kesiswaan: "text-purple-700",
  sarpras: "text-emerald-700",
  humas: "text-orange-700",
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

  const totalRealisasi = Object.values(data.statusMap).reduce((a, b) => a + b, 0)
  const terlaksana = data.statusMap["terlaksana"] || 0
  const capaian = totalRealisasi > 0 ? Math.round((terlaksana / totalRealisasi) * 100) : 0
  const maxChartValue = Math.max(...data.bulanChart.map((b) => b.jumlah), 1)

  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-sm bg-primary text-primary-foreground">
              <ShieldCheckIcon className="size-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight">Portal Wakasek</span>
              <span className="text-[10px] text-muted-foreground leading-tight">SMAN 1 Bantarujeg</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                <ActivityIcon className="mr-1 size-3" />
                {data.prokerBulanIni.length} proker aktif bulan ini
              </Badge>
            )}
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:py-12">
        {/* Hero */}
        <section className="text-center">
          <Badge variant="secondary" className="mb-4">
            <SparklesIcon className="mr-1 size-3" />
            Tahun Ajaran {data.tahunIni}
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Manajemen Program Kerja
            <br />
            <span className="text-primary">Wakil Kepala Sekolah</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Platform terpadu untuk merencanakan, mengelola, dan memantau realisasi
            program kerja seluruh bidang wakasek SMAN 1 Bantarujeg.
          </p>
        </section>

        {/* Highlight stats */}
        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border-l-4 border-l-blue-500">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Total Program Kerja</p>
                  <p className="text-3xl font-bold tracking-tight">{data.totalProker}</p>
                  <p className="text-xs text-muted-foreground">
                    di {BIDANG_OPTIONS.length} bidang
                  </p>
                </div>
                <div className="grid size-10 place-items-center rounded-sm bg-blue-50">
                  <ClipboardListIcon className="size-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-green-500">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Skt Terlaksana</p>
                  <p className="text-3xl font-bold tracking-tight">{terlaksana}</p>
                  <p className="text-xs text-muted-foreground">
                    dari {totalRealisasi} total realisasi
                  </p>
                </div>
                <div className="grid size-10 place-items-center rounded-sm bg-green-50">
                  <CheckCircle2Icon className="size-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-amber-500">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Tingkat Capaian</p>
                  <p className="text-3xl font-bold tracking-tight">{capaian}%</p>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-amber-100">
                    <div
                      className="h-full bg-amber-500 transition-all"
                      style={{ width: `${capaian}%` }}
                    />
                  </div>
                </div>
                <div className="grid size-10 place-items-center rounded-sm bg-amber-50">
                  <TrendingUpIcon className="size-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-l-4 border-l-purple-500">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Total Anggaran</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {new Intl.NumberFormat("id-ID", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(data.totalAnggaran)}
                  </p>
                  <p className="text-xs text-muted-foreground">rupiah</p>
                </div>
                <div className="grid size-10 place-items-center rounded-sm bg-purple-50">
                  <WalletIcon className="size-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Highlight bulan ini + Chart */}
        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {/* Highlight bulan ini */}
          <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-primary/0 lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    <CalendarDaysIcon className="mr-1 size-3" />
                    Bulan Ini
                  </Badge>
                  <h2 className="text-xl font-bold tracking-tight">
                    {data.namaBulan} {data.tahunIni}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {data.prokerBulanIni.length} program kerja dijadwalkan
                  </p>
                </div>
                <div className="hidden sm:block">
                  <div className="grid size-16 place-items-center rounded-sm bg-primary/10">
                    <TargetIcon className="size-8 text-primary" />
                  </div>
                </div>
              </div>

              {data.prokerBulanIni.length > 0 && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {data.prokerBulanIni.slice(0, 4).map((p: {
                    id: string
                    bidang: string
                    nama_kegiatan: string
                    penanggung_jawab: string
                  }) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 rounded-sm border bg-background/50 p-2"
                    >
                      <div className={`grid size-7 shrink-0 place-items-center rounded-sm ${BIDANG_OPTIONS.find((b) => b.value === p.bidang)?.color.split(" ")[0]}`}>
                        {(() => {
                          const Icon = BIDANG_ICONS[p.bidang]
                          return Icon ? <Icon className="size-3.5" /> : null
                        })()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium leading-tight">
                          {p.nama_kegiatan}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {p.penanggung_jawab}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {data.prokerBulanIni.length === 0 && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Belum ada proker dijadwalkan bulan ini.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Chart distribusi bulanan */}
          <Card>
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Distribusi Tahunan</p>
                  <p className="text-sm font-semibold">Proker per Bulan</p>
                </div>
                <CalendarDaysIcon className="size-4 text-muted-foreground" />
              </div>
              <div className="flex h-32 items-end gap-1">
                {data.bulanChart.map((b) => {
                  const height = (b.jumlah / maxChartValue) * 100
                  const isCurrent = b.bulan === data.bulanIni
                  return (
                    <div
                      key={b.bulan}
                      className="group flex flex-1 flex-col items-center gap-1"
                      title={`${b.label}: ${b.jumlah} proker`}
                    >
                      <div
                        className={`w-full rounded-t-sm transition-all ${
                          isCurrent ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                        style={{
                          height: `${Math.max(height, b.jumlah > 0 ? 6 : 2)}%`,
                        }}
                      />
                      <span className="text-[9px] font-medium text-muted-foreground">
                        {b.label.charAt(0)}
                      </span>
                    </div>
                  )
                })}
              </div>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                {data.tahunIni}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Program kerja bulan ini (full) */}
        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="size-5 text-primary" />
                <h2 className="text-xl font-bold tracking-tight">
                  Program Kerja {data.namaBulan}
                </h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Daftar kegiatan yang dijadwalkan pada bulan berjalan
              </p>
            </div>
          </div>

          {data.prokerBulanIni.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                <ClipboardListIcon className="size-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Belum ada program kerja terjadwal di {data.namaBulan}.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.prokerBulanIni.map((p: {
                id: string
                bidang: string
                nama_kegiatan: string
                deskripsi: string | null
                penanggung_jawab: string
                anggaran: number
                tahun_ajaran: string
              }) => {
                const Icon = BIDANG_ICONS[p.bidang] || ClipboardListIcon
                return (
                  <Card key={p.id} className={`overflow-hidden border bg-gradient-to-br ${BIDANG_GRADIENT[p.bidang] || ""}`}>
                    <CardContent className="p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <div className={`grid size-9 place-items-center rounded-sm ${BIDANG_OPTIONS.find((b) => b.value === p.bidang)?.color.split(" ")[0]}`}>
                          <Icon className={`size-4 ${BIDANG_TEXT[p.bidang]}`} />
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          T.A. {p.tahun_ajaran}
                        </Badge>
                      </div>
                      <h3 className="text-base font-semibold leading-snug">
                        {p.nama_kegiatan}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {bidangLabel(p.bidang)}
                      </p>
                      {p.deskripsi && (
                        <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                          {p.deskripsi}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <UsersIcon className="size-3.5" />
                          <span className="truncate max-w-32">{p.penanggung_jawab}</span>
                        </div>
                        {p.anggaran > 0 && (
                          <span className="font-semibold text-foreground">
                            {formatRupiah(p.anggaran)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        {/* Bidang */}
        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-xl font-bold tracking-tight">Bidang Wakasek</h2>
            <p className="text-sm text-muted-foreground">
              Empat bidang utama yang mengelola program kerja
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BIDANG_OPTIONS.map((b) => {
              const Icon = BIDANG_ICONS[b.value]
              const count = bidangMap[b.value] || 0
              return (
                <Card
                  key={b.value}
                  className={`group overflow-hidden bg-gradient-to-br ${BIDANG_GRADIENT[b.value]} transition-colors`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className={`grid size-10 place-items-center rounded-sm ${b.color.split(" ")[0]}`}>
                        <Icon className={`size-5 ${BIDANG_TEXT[b.value]}`} />
                      </div>
                      <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold">{b.label}</h3>
                    <p className="mt-1 text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">program kerja</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Status snapshot */}
        {totalRealisasi > 0 && (
          <section className="mt-10">
            <div className="mb-4">
              <h2 className="text-xl font-bold tracking-tight">Status Realisasi</h2>
              <p className="text-sm text-muted-foreground">
                Ringkasan status pelaksanaan kegiatan
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { key: "terlaksana", label: "Terlaksana", color: "text-green-700 bg-green-50 border-green-200" },
                { key: "belum_dimulai", label: "Belum Dimulai", color: "text-gray-700 bg-gray-50 border-gray-200" },
                { key: "ditunda", label: "Ditunda", color: "text-amber-700 bg-amber-50 border-amber-200" },
                { key: "tidak_jjadi", label: "Tidak Jadi", color: "text-red-700 bg-red-50 border-red-200" },
              ].map((s) => {
                const count = data.statusMap[s.key] || 0
                const pct = Math.round((count / totalRealisasi) * 100)
                return (
                  <Card key={s.key} className={`border ${s.color.split(" ")[2]}`}>
                    <CardContent className="p-4">
                      <p className="text-xs font-medium">{s.label}</p>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{count}</span>
                        <span className="text-xs text-muted-foreground">({pct}%)</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
                        <div
                          className={`h-full ${
                            s.key === "terlaksana" ? "bg-green-500" :
                            s.key === "belum_dimulai" ? "bg-gray-400" :
                            s.key === "ditunda" ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* CTA */}
        {!isLoggedIn && (
          <section className="mt-12">
            <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
              <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:p-12">
                <SparklesIcon className="size-10 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Siap Mengelola Program Kerja?
                </h2>
                <p className="max-w-xl text-sm text-muted-foreground">
                  Masuk ke portal untuk mengelola program kerja, melihat
                  realisasi, dan memantau capaian setiap bidang wakasek.
                </p>
                <Link href="/login">
                  <Button size="lg">
                    Masuk Sekarang <ArrowRightIcon className="size-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      <footer className="mt-12 border-t bg-background/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 text-xs text-muted-foreground">
          <span>Portal Wakasek · SMAN 1 Bantarujeg</span>
          <span>{data.tahunIni}</span>
        </div>
      </footer>
    </div>
  )
}