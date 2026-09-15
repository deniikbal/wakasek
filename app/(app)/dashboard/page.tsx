import { pool } from "@/lib/db"
import { BIDANG_OPTIONS, bidangLabel } from "@/lib/constants"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ClipboardListIcon,
  CheckCircle2Icon,
  ClockIcon,
  XCircleIcon,
  ArrowRightIcon,
} from "lucide-react"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

async function getStats(bidang: string | null = null) {
  const client = await pool.connect()
  // Untuk non-admin: batasi hanya proker/realisasi bidang sendiri
  const filterBidang = bidang ? `WHERE bidang = $1` : ""
  const params = bidang ? [bidang] : []
  try {
    // Hitung jumlah proker per bidang
    const prokerPerBidang = await client.query(`
      SELECT bidang, COUNT(*)::int as jumlah
      FROM proker ${bidang ? `WHERE bidang = $1` : ""}
      GROUP BY bidang
    `, params)

    // Hitung total anggaran
    const totalAnggaran = await client.query(`
      SELECT COALESCE(SUM(anggaran), 0)::bigint as total FROM proker ${filterBidang}
    `, params)

    // Hitung realisasi per status
    const realisasiPerStatus = await client.query(`
      SELECT r.status, COUNT(*)::int as jumlah
      FROM realisasi r
      JOIN proker p ON p.id = r.proker_id
      ${bidang ? `WHERE p.bidang = $1` : ""}
      GROUP BY r.status
    `, params)

    // Recent proker
    const recentProker = await client.query(`
      SELECT id, bidang, nama_kegiatan, tahun_ajaran, created_at
      FROM proker ${filterBidang}
      ORDER BY created_at DESC
      LIMIT 5
    `, params)

    return {
      prokerPerBidang: prokerPerBidang.rows,
      totalAnggaran: totalAnggaran.rows[0].total,
      realisasiPerStatus: realisasiPerStatus.rows,
      recentProker: recentProker.rows,
    }
  } finally {
    client.release()
  }
}

const ROLE_TO_BIDANG: Record<string, string> = {
  kurikulum: "kurikulum",
  kesiswaan: "kesiswaan",
  sarpras: "sarpras",
  humas: "humas",
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const userRole = session?.user.role || ""
  const bidangFilter = userRole === "admin" ? null : (ROLE_TO_BIDANG[userRole] || null)
  const stats = await getStats(bidangFilter)

  const prokerMap: Record<string, number> = {}
  stats.prokerPerBidang.forEach((r: { bidang: string; jumlah: number }) => {
    prokerMap[r.bidang] = r.jumlah
  })
  const totalProker = Object.values(prokerMap).reduce((a, b) => a + b, 0)

  const statusMap: Record<string, number> = {}
  stats.realisasiPerStatus.forEach((r: { status: string; jumlah: number }) => {
    statusMap[r.status] = r.jumlah
  })
  const totalRealisasi = Object.values(statusMap).reduce((a, b) => a + b, 0)

  const statusCards = [
    { key: "terlaksana", label: "Terlaksana", icon: CheckCircle2Icon, variant: "success" as const },
    { key: "belum_dimulai", label: "Belum Dimulai", icon: ClockIcon, variant: "secondary" as const },
    { key: "ditunda", label: "Ditunda", icon: ClockIcon, variant: "warning" as const },
    { key: "tidak_jadi", label: "Tidak Jadi", icon: XCircleIcon, variant: "destructive" as const },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Selamat datang, {session?.user.name || session?.user.email}. Ringkasan program kerja & realisasi.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription>Total Program Kerja</CardDescription>
              <ClipboardListIcon className="size-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl">{totalProker}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription>Total Realisasi</CardDescription>
              <CheckCircle2Icon className="size-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-3xl">{totalRealisasi}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total Anggaran</CardDescription>
            <CardTitle className="text-2xl">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
                notation: "compact",
              }).format(Number(stats.totalAnggaran))}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Tingkat Capaian</CardDescription>
            <CardTitle className="text-3xl">
              {totalRealisasi > 0
                ? Math.round(((statusMap["terlaksana"] || 0) / totalRealisasi) * 100)
                : 0}
              %
            </CardTitle>
            <CardDescription>
              {statusMap["terlaksana"] || 0} dari {totalRealisasi} terlaksana
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Realisasi per status */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status Realisasi</CardTitle>
            <CardDescription>Distribusi status pelaksanaan kegiatan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {statusCards.map((s) => {
                const Icon = s.icon
                return (
                  <div
                    key={s.key}
                    className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center"
                  >
                    <Icon className="size-5 text-muted-foreground" />
                    <span className="text-2xl font-bold">{statusMap[s.key] || 0}</span>
                    <Badge variant={s.variant}>{s.label}</Badge>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Proker per bidang */}
        <Card>
          <CardHeader>
            <CardTitle>Program Kerja per Bidang</CardTitle>
            <CardDescription>Jumlah proker di setiap bidang wakasek</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {BIDANG_OPTIONS.map((b) => {
                const count = prokerMap[b.value] || 0
                const pct = totalProker > 0 ? (count / totalProker) * 100 : 0
                return (
                  <div key={b.value} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{b.label}</span>
                      <span className="text-muted-foreground">{count} proker</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${b.color.split(" ")[0]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent proker */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Program Kerja Terbaru</CardTitle>
              <CardDescription>5 proker yang baru ditambahkan</CardDescription>
            </div>
            <Link href="/proker">
              <Button variant="outline" size="sm">
                Lihat semua <ArrowRightIcon />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats.recentProker.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <ClipboardListIcon className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Belum ada program kerja.</p>
              <Link href="/proker">
                <Button size="sm">Tambah Proker</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {stats.recentProker.map((p: { id: string; bidang: string; nama_kegiatan: string; tahun_ajaran: string }) => (
                <Link
                  key={p.id}
                  href={`/proker`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Badge variant="outline" className={bidangLabel(p.bidang) ? "" : ""}>
                      {bidangLabel(p.bidang)}
                    </Badge>
                    <span className="truncate text-sm font-medium">{p.nama_kegiatan}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{p.tahun_ajaran}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
